'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Loader2, Trash2, Clock, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

interface UploadResult {
  fileName: string;
  status: 'success' | 'error' | 'processing' | 'pending';
  message: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  errors?: string[];
}

interface QueuedFile {
  id: string;
  file: File;
  fileType: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: UploadResult;
}

type TabKey = 'departments' | 'products' | 'transactions';

const tabConfig: { key: TabKey; label: string; description: string; hint: string; accept: string }[] = [
  {
    key: 'departments',
    label: 'Departments',
    description: 'Upload one or more Departments.JSON files. The files should contain department data with keys as department IDs and values containing Description field.',
    hint: 'Click or drag Departments.JSON file(s) here',
    accept: '.json,.JSON',
  },
  {
    key: 'products',
    label: 'Products (SKUs)',
    description: 'Upload one or more SKUs.json files. The files should contain store IDs as keys with arrays of products as values.',
    hint: 'Click or drag SKUs.json file(s) here',
    accept: '.json,.JSON',
  },
  {
    key: 'transactions',
    label: 'Transactions',
    description: 'Upload multiple transaction files named with shift numbers (e.g., 12074.JSON, 12075.JSON). Files contain transaction data for merchandise and fuel sales.',
    hint: 'Click or drag transaction file(s) here. Format: shiftNumber.JSON',
    accept: '.json,.JSON',
  },
];

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('departments');
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const processDepartmentsFile = async (fileContent: string, fileName: string): Promise<UploadResult> => {
    const supabase = createClient();
    try {
      const validFileNames = ['Departments.JSON', 'departments.json', 'Departments.json', 'departments.JSON'];
      if (!validFileNames.includes(fileName)) {
        throw new Error(`Invalid file name. Expected one of: ${validFileNames.join(', ')}. Got: ${fileName}`);
      }
      const data = JSON.parse(fileContent);
      const departments: Array<{ store_id: string; description: string }> = [];
      const errors: string[] = [];

      Object.entries(data).forEach(([departmentId, value]: [string, unknown]) => {
        try {
          const deptValue = value as { Description?: string };
          departments.push({ store_id: departmentId, description: deptValue.Description?.trim() || '' });
        } catch (error: unknown) {
          errors.push(`Failed to process department ${departmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (departments.length === 0) throw new Error('No valid departments found in file');

      const { data: insertedData, error } = await supabase.from('departments').insert(departments).select();
      if (error) throw new Error(error.message);

      return {
        fileName: 'Departments.JSON', status: 'success',
        message: `Successfully uploaded ${insertedData?.length || 0} departments`,
        recordsProcessed: insertedData?.length || 0, recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    } catch (error: unknown) {
      return { fileName: 'Departments.JSON', status: 'error', message: error instanceof Error ? error.message : 'Failed to process file', recordsProcessed: 0, recordsFailed: 0 };
    }
  };

  const processProductsFile = async (fileContent: string, storeId: number, fileName: string): Promise<UploadResult> => {
    const supabase = createClient();
    try {
      const validFileNames = ['SKUs.json', 'skus.json', 'SKUs.JSON', 'skus.JSON'];
      if (!validFileNames.includes(fileName)) {
        throw new Error(`Invalid file name. Expected one of: ${validFileNames.join(', ')}. Got: ${fileName}`);
      }
      const data = JSON.parse(fileContent);
      const products: Array<{ storeId: string; department_id: number | null; description: string; price: number; ageRestriction: boolean; tax1: boolean; tax2: boolean }> = [];
      const errors: string[] = [];

      Object.entries(data).forEach(([productId, productData]: [string, unknown]) => {
        try {
          const product = productData as { Department?: string | number; English_Description?: string; Price?: number; Age_Requirements?: number; TAX1?: boolean; TAX2?: boolean };
          const departmentId = product.Department ? parseInt(String(product.Department)) : null;
          products.push({
            storeId: productId, department_id: departmentId,
            description: product.English_Description?.trim() || '',
            price: product.Price ? product.Price / 100 : 0,
            ageRestriction: product.Age_Requirements ? product.Age_Requirements > 17 : false,
            tax1: product.TAX1 || false, tax2: product.TAX2 || false,
          });
        } catch (error: unknown) {
          errors.push(`Failed to process product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (products.length === 0) throw new Error('No valid products found in file');

      const batchSize = 100;
      let totalInserted = 0;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { data: insertedData, error } = await supabase.from('products').insert(batch).select();
        if (error) errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        else totalInserted += insertedData?.length || 0;
      }

      return {
        fileName: 'SKUs.json', status: totalInserted > 0 ? 'success' : 'error',
        message: `Successfully uploaded ${totalInserted} products for store ${storeId}`,
        recordsProcessed: totalInserted, recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    } catch (error: unknown) {
      return { fileName: 'SKUs.json', status: 'error', message: error instanceof Error ? error.message : 'Failed to process file', recordsProcessed: 0, recordsFailed: 0 };
    }
  };

  const processTransactionFile = async (fileName: string, fileContent: string): Promise<UploadResult> => {
    const supabase = createClient();
    try {
      const shiftNumber = parseInt(fileName.replace('.JSON', '').replace('.json', ''));
      if (isNaN(shiftNumber)) throw new Error('Invalid shift number in filename');

      const data = JSON.parse(fileContent);
      const transactions: Array<{
        shiftNumber: number; productId: number | null; productDescription: string; quantity: number;
        amount: number; dateTime: string; isGasTrn: boolean; typeOfGas: string | null;
        volume: number | null; pump: number | null; safedrop: number | null; lotto: number | null;
        payout: number | null; payout_type: string | null; trn_type: string; unique_key: string;
      }> = [];
      const errors: string[] = [];

      if (!Array.isArray(data)) throw new Error('Expected an array of transactions');

      data.forEach((transaction: unknown, index: number) => {
        try {
          const trn = transaction as {
            Attributes?: { BT_Local_Trans_Date?: number | string; BT_Local_Trans_Time?: number | string; Safe_Drop_Amt?: number };
            InputLineItems?: Array<{
              LineItemType?: string; English_Description?: string; Item_Number?: number | string;
              Net?: number; UnModifiedPrice?: number; MilliLitres?: number; VPump?: number;
              PromptForPricePrice?: number; Amount?: number;
            }>;
          };
          const transDate = trn.Attributes?.BT_Local_Trans_Date;
          const transTime = trn.Attributes?.BT_Local_Trans_Time;
          if (!transDate || !transTime) { errors.push(`Transaction at index ${index}: Missing date or time`); return; }

          const dateStr = transDate.toString();
          const timeStr = transTime.toString().padStart(6, '0');
          const fullDateTime = new Date(
            parseInt(dateStr.substring(0, 4)), parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8)), parseInt(timeStr.substring(0, 2)),
            parseInt(timeStr.substring(2, 4)), parseInt(timeStr.substring(4, 6))
          );

          if (trn.Attributes && trn.Attributes.Safe_Drop_Amt !== undefined && trn.Attributes.Safe_Drop_Amt !== null) {
            transactions.push({
              shiftNumber, productId: null, productDescription: 'Safe Drop', quantity: 0, amount: 0,
              dateTime: fullDateTime.toISOString(), isGasTrn: false, typeOfGas: null, volume: null,
              pump: null, safedrop: trn.Attributes.Safe_Drop_Amt / 100, lotto: null, payout: null,
              payout_type: null, trn_type: 'safedrop', unique_key: `${shiftNumber}_${index}_safedrop`,
            });
          }

          if (!trn.InputLineItems || !Array.isArray(trn.InputLineItems)) return;

          trn.InputLineItems.forEach((item, itemIndex: number) => {
            try {
              const isGasTransaction = item.LineItemType === "GasLineItem";
              const isPayOutTransaction = item.LineItemType === "PayOutItem";
              const description = item.English_Description?.trim() || '';
              const isLottoTransaction = description === 'LOTTO';
              let trnType = 'merchandise';
              if (isGasTransaction) trnType = 'fuel';
              else if (isPayOutTransaction) trnType = 'payout';
              else if (isLottoTransaction) trnType = 'lotto';

              const productId = item.Item_Number ? parseInt(item.Item_Number.toString().replace(/^0+/, '')) || 0 : 0;

              transactions.push({
                shiftNumber, productId, productDescription: description,
                quantity: item.Net || (isGasTransaction ? 1 : 0),
                amount: item.UnModifiedPrice ? item.UnModifiedPrice / 100 : 0,
                dateTime: fullDateTime.toISOString(), isGasTrn: isGasTransaction,
                typeOfGas: isGasTransaction ? description : null,
                volume: item.MilliLitres ? item.MilliLitres / 1000 : null,
                pump: isGasTransaction ? (item.VPump ?? null) : null,
                safedrop: null,
                lotto: isLottoTransaction ? (item.PromptForPricePrice ? item.PromptForPricePrice / 100 : 0) : null,
                payout: isPayOutTransaction ? (item.Amount ? item.Amount / 100 : 0) : null,
                payout_type: isPayOutTransaction ? description : null,
                trn_type: trnType, unique_key: `${shiftNumber}_${index}_${itemIndex}`,
              });
            } catch (error: unknown) {
              errors.push(`Failed to process line item ${itemIndex} in transaction ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });
        } catch (error: unknown) {
          errors.push(`Failed to process transaction at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (transactions.length === 0) throw new Error('No valid transactions found in file');

      const batchSize = 100;
      let totalInserted = 0;
      const successfulTransactions: Array<{ isGasTrn?: boolean; productId?: number | null; quantity?: number }> = [];

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { data: insertedData, error } = await supabase.from('transactions').insert(batch).select();
        if (error) errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        else if (insertedData) { totalInserted += insertedData.length; successfulTransactions.push(...insertedData); }
      }

      for (const transaction of successfulTransactions) {
        if (!transaction.isGasTrn && transaction.productId && transaction.productId > 0) {
          try {
            const { data: productData, error: fetchError } = await supabase
              .from('products').select('stock').eq('storeId', transaction.productId).single();
            if (fetchError) { errors.push(`Failed to fetch product ${transaction.productId}: ${fetchError.message}`); continue; }
            const newStock = (productData?.stock || 0) - (transaction.quantity || 1);
            const { error: updateError } = await supabase
              .from('products').update({ stock: newStock }).eq('storeId', transaction.productId);
            if (updateError) errors.push(`Failed to update stock for product ${transaction.productId}: ${updateError.message}`);
          } catch (error: unknown) {
            errors.push(`Error updating stock for product ${transaction.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        fileName, status: totalInserted > 0 ? 'success' : 'error',
        message: `Successfully uploaded ${totalInserted} transactions for shift ${shiftNumber}`,
        recordsProcessed: totalInserted, recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    } catch (error: unknown) {
      return { fileName, status: 'error', message: error instanceof Error ? error.message : 'Failed to process file', recordsProcessed: 0, recordsFailed: 0 };
    }
  };

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) { setUploading(false); return; }

    isProcessingRef.current = true;
    setUploading(true);

    for (const queuedFile of pendingFiles) {
      setFileQueue(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: 'processing' as const } : f));

      try {
        const content = await queuedFile.file.text();
        let result: UploadResult;
        if (queuedFile.fileType === 'departments') result = await processDepartmentsFile(content, queuedFile.file.name);
        else if (queuedFile.fileType === 'products') result = await processProductsFile(content, 1, queuedFile.file.name);
        else result = await processTransactionFile(queuedFile.file.name, content);

        setFileQueue(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: result.status as 'success' | 'error', result } : f));
        setResults(prev => [result, ...prev]);
        if (result.status === 'success') toast.success(`${queuedFile.file.name}: ${result.message}`);
        else toast.error(`${queuedFile.file.name}: ${result.message}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        const errorResult: UploadResult = { fileName: queuedFile.file.name, status: 'error', message: errorMessage };
        setFileQueue(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: 'error' as const, result: errorResult } : f));
        setResults(prev => [errorResult, ...prev]);
        toast.error(`${queuedFile.file.name}: ${errorMessage}`);
      }
    }

    isProcessingRef.current = false;
    setUploading(false);
  }, [fileQueue]);

  useEffect(() => {
    const hasPendingFiles = fileQueue.some(f => f.status === 'pending');
    if (hasPendingFiles && !isProcessingRef.current) processQueue();
  }, [fileQueue, processQueue]);

  const addFilesToQueue = (files: File[], fileType: string) => {
    const newQueuedFiles: QueuedFile[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file, fileType, status: 'pending' as const,
    }));
    setFileQueue(prev => [...prev, ...newQueuedFiles]);
  };

  const removeFromQueue = (id: string) => setFileQueue(prev => prev.filter(f => f.id !== id));
  const clearCompletedFromQueue = () => setFileQueue(prev => prev.filter(f => f.status === 'pending' || f.status === 'processing'));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json') || f.name.endsWith('.JSON'));
    if (files.length > 0) addFilesToQueue(files, activeTab);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFilesToQueue(files, activeTab);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stats = {
    total: fileQueue.length,
    completed: fileQueue.filter(f => f.status === 'success' || f.status === 'error').length,
    pending: fileQueue.filter(f => f.status === 'pending').length,
    processing: fileQueue.filter(f => f.status === 'processing').length,
    success: fileQueue.filter(f => f.status === 'success').length,
    error: fileQueue.filter(f => f.status === 'error').length,
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const currentTab = tabConfig.find(t => t.key === activeTab)!;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'badge-green';
      case 'error': return 'badge-red';
      case 'processing': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">File Upload</h1>
        <p className="text-gray-500 mt-1">Upload JSON files to import departments, products, and transactions into the system. Select the appropriate tab for the file type you want to upload.</p>
      </div>

      {/* Tabs + Upload Area */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex px-4">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">{currentTab.description}</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
              ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={currentTab.accept}
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              ) : (
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-7 h-7 text-blue-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">{currentTab.hint}</p>
                <p className="text-xs text-gray-400 mt-1">Supports multiple JSON files. Files will be processed sequentially.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {fileQueue.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Upload Queue</h3>
              <span className="badge-blue">{stats.total} files</span>
              {stats.processing > 0 && <span className="badge-blue">Processing: {stats.processing}</span>}
              {stats.pending > 0 && <span className="badge-gray">Pending: {stats.pending}</span>}
              {stats.success > 0 && <span className="badge-green">Success: {stats.success}</span>}
              {stats.error > 0 && <span className="badge-red">Failed: {stats.error}</span>}
            </div>
            {stats.completed > 0 && (
              <button className="btn-secondary btn-sm" onClick={clearCompletedFromQueue}>
                Clear Completed
              </button>
            )}
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div className="px-6 pt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${stats.error > 0 && stats.pending === 0 && stats.processing === 0 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progressPercent}% complete</p>
            </div>
          )}

          {/* File list */}
          <div className="divide-y divide-gray-100">
            {fileQueue.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                {statusIcon(item.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{item.file.name}</span>
                    <span className={statusBadge(item.status)}>{item.status}</span>
                    <span className="badge-gray">{item.fileType}</span>
                  </div>
                  {item.result ? (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">{item.result.message}</p>
                      {item.result.recordsProcessed !== undefined && (
                        <p className="text-xs text-gray-400">
                          Processed: {item.result.recordsProcessed} | Failed: {item.result.recordsFailed || 0}
                        </p>
                      )}
                    </div>
                  ) : item.status === 'pending' ? (
                    <p className="text-xs text-gray-400 mt-1">Waiting in queue...</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Processing...</p>
                  )}
                </div>
                {item.status === 'pending' && (
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Upload Results</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map((item, idx) => (
              <div key={idx} className="px-6 py-4 flex items-start gap-4">
                {item.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{item.fileName}</span>
                    <span className={item.status === 'success' ? 'badge-green' : 'badge-red'}>{item.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                  {item.recordsProcessed !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      Processed: {item.recordsProcessed} | Failed: {item.recordsFailed || 0}
                    </p>
                  )}
                  {item.errors && item.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
                      <ul className="space-y-0.5">
                        {item.errors.slice(0, 5).map((error, errIdx) => (
                          <li key={errIdx} className="text-xs text-red-500">{error}</li>
                        ))}
                        {item.errors.length > 5 && (
                          <li className="text-xs text-gray-400">... and {item.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

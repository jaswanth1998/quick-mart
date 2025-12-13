'use client';

import React, { useState } from 'react';
import { Card, Upload, Space, Alert, Typography, Tabs, List, Tag, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface UploadResult {
  fileName: string;
  status: 'success' | 'error' | 'processing';
  message: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  errors?: string[];
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [activeTab, setActiveTab] = useState('departments');

  const processDepartmentsFile = async (fileContent: string, fileName: string): Promise<UploadResult> => {
    const supabase = createClient();

    try {
      // Validate file name
      const validFileNames = ['Departments.JSON', 'departments.json', 'Departments.json', 'departments.JSON'];
      if (!validFileNames.includes(fileName)) {
        throw new Error(`Invalid file name. Expected one of: ${validFileNames.join(', ')}. Got: ${fileName}`);
      }

      const data = JSON.parse(fileContent);
      const departments: Array<{ store_id: string; description: string }> = [];
      const errors: string[] = [];

      // Assuming store_id is 1 for now (you can make this configurable)

      // Departments.JSON structure: { "000002": { "Description": "..." }, ... }
      Object.entries(data).forEach(([departmentId, value]: [string, unknown]) => {
        try {
          const deptValue = value as { Description?: string };
          departments.push({
            store_id: departmentId,
            description: deptValue.Description?.trim() || '',
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process department ${departmentId}: ${errorMessage}`);
        }
      });

      if (departments.length === 0) {
        throw new Error('No valid departments found in file');
      }

      // Insert departments
      const { data: insertedData, error } = await supabase
        .from('departments')
        .insert(departments)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return {
        fileName: 'Departments.JSON',
        status: 'success',
        message: `Successfully uploaded ${insertedData?.length || 0} departments`,
        recordsProcessed: insertedData?.length || 0,
        recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      return {
        fileName: 'Departments.JSON',
        status: 'error',
        message: errorMessage,
        recordsProcessed: 0,
        recordsFailed: 0,
      };
    }
  };

  const processProductsFile = async (fileContent: string, storeId: number, fileName: string): Promise<UploadResult> => {
    const supabase = createClient();

    try {
      // Validate file name
      const validFileNames = ['SKUs.json', 'skus.json', 'SKUs.JSON', 'skus.JSON'];
      if (!validFileNames.includes(fileName)) {
        throw new Error(`Invalid file name. Expected one of: ${validFileNames.join(', ')}. Got: ${fileName}`);
      }

      const data = JSON.parse(fileContent);
      const products: Array<{
        storeId: string;
        department_id: number | null;
        description: string;
        price: number;
        ageRestriction: boolean;
        tax1: boolean;
        tax2: boolean;
      }> = [];
      const errors: string[] = [];

      // SKUs.json is an object where keys are product IDs and values are product data
      Object.entries(data).forEach(([productId, productData]: [string, unknown]) => {
        try {
          const product = productData as {
            Department?: string | number;
            English_Description?: string;
            Price?: number;
            Age_Requirements?: number;
            TAX1?: boolean;
            TAX2?: boolean;
          };
          // Parse department_id (remove leading zeros)
          const departmentId = product.Department ? parseInt(String(product.Department)) : null;

          products.push({
            storeId: productId,
            department_id: departmentId,
            description: product.English_Description?.trim() || '',
            price: product.Price ? product.Price / 100 : 0, // Convert cents to dollars
            ageRestriction: product.Age_Requirements ? product.Age_Requirements > 17 : false,
            tax1: product.TAX1 || false,
            tax2: product.TAX2 || false,
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process product ${productId}: ${errorMessage}`);
        }
      });

      if (products.length === 0) {
        throw new Error('No valid products found in file');
      }

      // Insert products in batches to avoid timeout
      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { data: insertedData, error } = await supabase
          .from('products')
          .insert(batch)
          .select();

        if (error) {
          errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        } else {
          totalInserted += insertedData?.length || 0;
        }
      }

      return {
        fileName: 'SKUs.json',
        status: totalInserted > 0 ? 'success' : 'error',
        message: `Successfully uploaded ${totalInserted} products for store ${storeId}`,
        recordsProcessed: totalInserted,
        recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      return {
        fileName: 'SKUs.json',
        status: 'error',
        message: errorMessage,
        recordsProcessed: 0,
        recordsFailed: 0,
      };
    }
  };

  const processTransactionFile = async (fileName: string, fileContent: string): Promise<UploadResult> => {
    const supabase = createClient();

    try {
      // Extract shift number from filename (e.g., "12074.JSON" -> 12074)
      const shiftNumber = parseInt(fileName.replace('.JSON', '').replace('.json', ''));

      if (isNaN(shiftNumber)) {
        throw new Error('Invalid shift number in filename');
      }

      const data = JSON.parse(fileContent);
      const transactions: Array<{
        shiftNumber: number;
        productId: number | null;
        productDescription: string;
        quantity: number;
        amount: number;
        dateTime: string;
        isGasTrn: boolean;
        typeOfGas: string | null;
        volume: number | null;
        pump: number | null;
        safedrop: number | null;
        lotto: number | null;
        payout: number | null;
        payout_type: string | null;
        trn_type: string;
        unique_key: string;
      }> = [];
      const errors: string[] = [];

      // Process transactions array
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of transactions');
      }

      data.forEach((transaction: unknown, index: number) => {
        try {
          const trn = transaction as {
            Attributes?: {
              BT_Local_Trans_Date?: number | string;
              BT_Local_Trans_Time?: number | string;
              Safe_Drop_Amt?: number;
            };
            InputLineItems?: Array<{
              LineItemType?: string;
              English_Description?: string;
              Item_Number?: number | string;
              Net?: number;
              UnModifiedPrice?: number;
              MilliLitres?: number;
              VPump?: number;
              PromptForPricePrice?: number;
              Amount?: number;
            }>;
          };
          const transDate = trn.Attributes?.BT_Local_Trans_Date;
          const transTime = trn.Attributes?.BT_Local_Trans_Time;

          if (!transDate || !transTime) {
            errors.push(`Transaction at index ${index}: Missing date or time`);
            return;
          }

          // Parse date (YYYYMMDD format) and time (HHMMSS format)
          const dateStr = transDate.toString();
          const timeStr = transTime.toString().padStart(6, '0');

          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
          const day = parseInt(dateStr.substring(6, 8));
          const hour = parseInt(timeStr.substring(0, 2));
          const minute = parseInt(timeStr.substring(2, 4));
          const second = parseInt(timeStr.substring(4, 6));

          const fullDateTime = new Date(year, month, day, hour, minute, second);

          // Check if this is a safe drop transaction

          if (trn.Attributes && trn.Attributes.Safe_Drop_Amt !== undefined && trn.Attributes.Safe_Drop_Amt !== null) {
            console.log('Processing transaction for stock update:', transaction);

            try {
              transactions.push({
                shiftNumber: shiftNumber,
                productId: null,
                productDescription: 'Safe Drop',
                quantity: 0,
                amount: 0,
                dateTime: fullDateTime.toISOString(),
                isGasTrn: false,
                typeOfGas: null,
                volume: null,
                pump: null,
                safedrop: trn.Attributes.Safe_Drop_Amt / 100, // Convert cents to CAD
                lotto: null,
                payout: null,
                payout_type: null,
                trn_type: 'safedrop',
                unique_key: `${shiftNumber}_${index}_safedrop`,
              });
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Failed to process safe drop in transaction ${index}: ${errorMessage}`);
            }
          }

          // Process line items only if they exist
          if (!trn.InputLineItems || !Array.isArray(trn.InputLineItems)) {
            return; // Skip if no line items
          }

          // Process each line item
          trn.InputLineItems.forEach((item, itemIndex: number) => {
            try {
              const isGasTransaction = item.LineItemType === "GasLineItem";
              const isPayOutTransaction = item.LineItemType === "PayOutItem";
              const description = item.English_Description?.trim() || '';
              const isLottoTransaction = description === 'LOTTO';

              // Determine transaction type
              let trnType = 'merchandise'; // default
              if (isGasTransaction) {
                trnType = 'fuel';
              } else if (isPayOutTransaction) {
                trnType = 'payout';
              } else if (isLottoTransaction) {
                trnType = 'lotto';
              }

              // Extract product ID from Item_Number (remove leading zeros)
              const productId = item.Item_Number ? parseInt(item.Item_Number.toString().replace(/^0+/, '')) || 0 : 0;

              transactions.push({
                shiftNumber: shiftNumber,
                productId: productId,
                productDescription: description,
                quantity: item.Net || (isGasTransaction ? 1 : 0), // For gas, quantity is usually 1
                amount: item.UnModifiedPrice ? item.UnModifiedPrice / 100 : 0, // Convert cents to dollars
                dateTime: fullDateTime.toISOString(),
                isGasTrn: isGasTransaction,
                typeOfGas: isGasTransaction ? description : null,
                volume: item.MilliLitres ? item.MilliLitres / 1000 : null, // Convert to liters
                pump: isGasTransaction ? (item.VPump ?? null) : null,
                safedrop: null, // No safe drop for regular transactions
                lotto: isLottoTransaction ? (item.PromptForPricePrice ? item.PromptForPricePrice / 100 : 0) : null, // Convert cents to CAD for lotto
                payout: isPayOutTransaction ? (item.Amount ? item.Amount / 100 : 0) : null, // Convert cents to CAD for payout
                payout_type: isPayOutTransaction ? description : null,
                trn_type: trnType,
                unique_key: `${shiftNumber}_${index}_${itemIndex}`, // To prevent duplicates
              });
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Failed to process line item ${itemIndex} in transaction ${index}: ${errorMessage}`);
            }
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process transaction at index ${index}: ${errorMessage}`);
        }
      });

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in file');
      }

      // Insert transactions in batches to avoid timeout
      const batchSize = 100;
      let totalInserted = 0;
      const successfulTransactions: Array<{
        isGasTrn?: boolean;
        productId?: number | null;
        quantity?: number;
      }> = [];

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { data: insertedData, error } = await supabase
          .from('transactions')
          .insert(batch)
          .select();

        if (error) {
          errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        } else {
          if (insertedData) {
            totalInserted += insertedData.length;
            // Only add to successfulTransactions if they were actually inserted
            successfulTransactions.push(...insertedData);
          }
        }
      }

      // Update stock for successfully inserted merchandise transactions
      for (const transaction of successfulTransactions) {
        // Only process merchandise transactions (not gas)
        if (!transaction.isGasTrn && transaction.productId && transaction.productId > 0) {
          try {
            // Get current stock
            const { data: productData, error: fetchError } = await supabase
              .from('products')
              .select('stock')
              .eq('storeId', transaction.productId)
              .single();

            if (fetchError) {
              console.log('Processing transaction for stock update:', transaction);

              errors.push(`Failed to fetch product ${transaction.productId}: ${fetchError.message}`);
              continue;
            }

            // Calculate new stock by decreasing by quantity
            const newStock = (productData?.stock || 0) - (transaction.quantity || 1);

            // Update stock
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('storeId', transaction.productId);

            if (updateError) {
              console.log('Processing transaction for stock update:', transaction);

              errors.push(`Failed to update stock for product ${transaction.productId}: ${updateError.message}`);
            }
          } catch (error: unknown) {
            console.log('Processing transaction for stock update:', transaction);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Error updating stock for product ${transaction.productId}: ${errorMessage}`);
          }
        }
      }

      return {
        fileName: fileName,
        status: totalInserted > 0 ? 'success' : 'error',
        message: `Successfully uploaded ${totalInserted} transactions for shift ${shiftNumber}`,
        recordsProcessed: totalInserted,
        recordsFailed: errors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors to 10
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      return {
        fileName: fileName,
        status: 'error',
        message: errorMessage,
        recordsProcessed: 0,
        recordsFailed: 0,
      };
    }
  };

  const handleUpload = async (file: File, fileType: string) => {
    setUploading(true);

    try {
      const content = await file.text();
      let result: UploadResult;

      if (fileType === 'departments') {
        result = await processDepartmentsFile(content, file.name);
      } else if (fileType === 'products') {
        // For now, using store ID 1. In production, this should be a user input
        result = await processProductsFile(content, 1, file.name);
      } else {
        // Transaction file
        result = await processTransactionFile(file.name, content);
      }

      setResults((prev) => [result, ...prev]);

      if (result.status === 'success') {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = (fileType: string) => ({
    name: 'file',
    multiple: false,
    accept: '.json,.JSON',
    beforeUpload: (file: File) => {
      handleUpload(file, fileType);
      return false; // Prevent automatic upload
    },
    showUploadList: false,
  });

  const tabItems = [
    {
      key: 'departments',
      label: 'Departments',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="Upload Departments File"
            description="Upload a Departments.JSON file. The file should contain department data with keys as department IDs and values containing Description field."
            type="info"
            showIcon
          />
          <Dragger {...uploadProps('departments')} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            </p>
            <p className="ant-upload-text">Click or drag Departments.JSON to this area</p>
            <p className="ant-upload-hint">
              Supports JSON format only. File will be processed immediately.
            </p>
          </Dragger>
        </Space>
      ),
    },
    {
      key: 'products',
      label: 'Products (SKUs)',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="Upload Products File"
            description="Upload a SKUs.json file. The file should contain store IDs as keys with arrays of products as values."
            type="info"
            showIcon
          />
          <Dragger {...uploadProps('products')} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            </p>
            <p className="ant-upload-text">Click or drag SKUs.json to this area</p>
            <p className="ant-upload-hint">
              Supports JSON format only. File will be processed immediately.
            </p>
          </Dragger>
        </Space>
      ),
    },
    {
      key: 'transactions',
      label: 'Transactions',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="Upload Transaction Files"
            description="Upload transaction files named with shift numbers (e.g., 12074.JSON, 12075.JSON). Files contain transaction data for merchandise and fuel sales."
            type="info"
            showIcon
          />
          <Dragger {...uploadProps('transactions')} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            </p>
            <p className="ant-upload-text">Click or drag transaction file to this area</p>
            <p className="ant-upload-hint">
              File name should be in format: shiftNumber.JSON (e.g., 12074.JSON)
            </p>
          </Dragger>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={2}>File Upload</Title>
          <Paragraph>
            Upload JSON files to import departments, products, and transactions into the system.
            Select the appropriate tab for the file type you want to upload.
          </Paragraph>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {results.length > 0 && (
          <Card title="Upload Results">
            <List
              dataSource={results}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.status === 'success' ? (
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      ) : item.status === 'error' ? (
                        <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                      ) : (
                        <LoadingOutlined style={{ fontSize: 24 }} />
                      )
                    }
                    title={
                      <Space>
                        <Text strong>{item.fileName}</Text>
                        <Tag color={item.status === 'success' ? 'success' : 'error'}>
                          {item.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>{item.message}</Text>
                        {item.recordsProcessed !== undefined && (
                          <Text type="secondary">
                            Processed: {item.recordsProcessed} | Failed: {item.recordsFailed || 0}
                          </Text>
                        )}
                        {item.errors && item.errors.length > 0 && (
                          <div>
                            <Text type="danger">Errors:</Text>
                            <ul style={{ marginTop: 4 }}>
                              {item.errors.slice(0, 5).map((error, idx) => (
                                <li key={idx}>
                                  <Text type="danger" style={{ fontSize: 12 }}>
                                    {error}
                                  </Text>
                                </li>
                              ))}
                              {item.errors.length > 5 && (
                                <li>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    ... and {item.errors.length - 5} more errors
                                  </Text>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </div>
  );
}

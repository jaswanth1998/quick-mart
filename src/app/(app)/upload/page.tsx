'use client';

import React, { useState } from 'react';
import { Card, Upload, Button, Space, Alert, Typography, Tabs, List, Tag, Progress, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
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

  const processDepartmentsFile = async (fileContent: string): Promise<UploadResult> => {
    const supabase = createClient();
    
    try {
      const data = JSON.parse(fileContent);
      const departments: any[] = [];
      const errors: string[] = [];
      
      // Assuming store_id is 1 for now (you can make this configurable)
      const storeId = 1;

      // Departments.JSON structure: { "000002": { "Description": "..." }, ... }
      Object.entries(data).forEach(([departmentId, value]: [string, any]) => {
        try {
          departments.push({
            store_id: storeId,
            description: value.Description?.trim() || '',
          });
        } catch (error: any) {
          errors.push(`Failed to process department ${departmentId}: ${error.message}`);
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
    } catch (error: any) {
      return {
        fileName: 'Departments.JSON',
        status: 'error',
        message: error.message || 'Failed to process file',
        recordsProcessed: 0,
        recordsFailed: 0,
      };
    }
  };

  const processProductsFile = async (fileContent: string, storeId: number): Promise<UploadResult> => {
    const supabase = createClient();
    
    try {
      const data = JSON.parse(fileContent);
      const products: any[] = [];
      const errors: string[] = [];

      // SKUs.json is an object where keys are product IDs and values are product data
      Object.entries(data).forEach(([productId, productData]: [string, any]) => {
        try {
          // Parse department_id (remove leading zeros)
          const departmentId = productData.Department ? parseInt(productData.Department) : null;
          
          products.push({
            storeId: storeId,
            department_id: departmentId,
            description: productData.English_Description?.trim() || '',
            price: productData.Price ? productData.Price / 100 : 0, // Convert cents to dollars
            ageRestriction: productData.Age_Requirements ? productData.Age_Requirements > 17 : false,
            tax1: productData.TAX1 || false,
            tax2: productData.TAX2 || false,
          });
        } catch (error: any) {
          errors.push(`Failed to process product ${productId}: ${error.message}`);
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
    } catch (error: any) {
      return {
        fileName: 'SKUs.json',
        status: 'error',
        message: error.message || 'Failed to process file',
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
      const transactions: any[] = [];
      const errors: string[] = [];

      // Process transactions array
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of transactions');
      }

      data.forEach((transaction: any, index: number) => {
        try {
          if (!transaction.InputLineItems || !Array.isArray(transaction.InputLineItems)) {
            return; // Skip if no line items
          }

          const transDate = transaction.Attributes?.BT_Local_Trans_Date;
          const transTime = transaction.Attributes?.BT_Local_Trans_Time;

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

          // Process each line item
          transaction.InputLineItems.forEach((item: any, itemIndex: number) => {
            try {
              const isGasTransaction = !!item.VPump;
              
              // Extract product ID from Item_Number (remove leading zeros)
              const productId = item.Item_Number ? parseInt(item.Item_Number.toString().replace(/^0+/, '')) || 0 : 0;
              
              transactions.push({
                shiftNumber: shiftNumber,
                productId: productId,
                productDescription: item.English_Description?.trim() || '',
                quantity: item.Net || (isGasTransaction ? 1 : 0), // For gas, quantity is usually 1
                amount: item.UnModifiedPrice ? item.UnModifiedPrice / 100 : 0, // Convert cents to dollars
                dateTime: fullDateTime.toISOString(),
                isGasTrn: isGasTransaction,
                typeOfGas: isGasTransaction ? item.English_Description?.trim() : null,
                volume: item.MilliLitres ? item.MilliLitres / 1000 : null, // Convert to liters
                pump: isGasTransaction ? item.VPump : null,
              });
            } catch (error: any) {
              errors.push(`Failed to process line item ${itemIndex} in transaction ${index}: ${error.message}`);
            }
          });
        } catch (error: any) {
          errors.push(`Failed to process transaction at index ${index}: ${error.message}`);
        }
      });

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in file');
      }

      // Insert transactions in batches to avoid timeout
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { data: insertedData, error } = await supabase
          .from('transactions')
          .insert(batch)
          .select();

        if (error) {
          errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        } else {
          totalInserted += insertedData?.length || 0;
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
    } catch (error: any) {
      return {
        fileName: fileName,
        status: 'error',
        message: error.message || 'Failed to process file',
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
        result = await processDepartmentsFile(content);
      } else if (fileType === 'products') {
        // For now, using store ID 1. In production, this should be a user input
        result = await processProductsFile(content, 1);
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
    } catch (error: any) {
      message.error(error.message || 'Failed to upload file');
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

'use client';

import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Title level={3}>Coming Soon</Title>
        <Paragraph type="secondary">
          Dashboard features are currently under development. Please check back later.
        </Paragraph>
      </Card>
    </div>
  );
}

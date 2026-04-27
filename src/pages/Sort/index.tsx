import React from 'react';
import styled from 'styled-components';
import { Tabs } from 'antd';
import InsertionSort from '../InsertionSort';
import MergeSort from '../MergeSort';
import SelectionSort from '../SelectionSort';
import ShellSort from '../ShellSort';

const SortWrapper = styled.div`
  background: #f8fafc;
  min-height: calc(100vh - 64px);
  padding-top: 1rem;
  
  .ant-tabs-nav {
    margin-bottom: 0 !important;
    padding: 0 2rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .ant-tabs-tab {
    font-family: 'Motiva Sans Bold', serif;
    font-size: 1.05rem;
    color: #4a5568;
    padding: 1rem 0;
  }
  
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #2e186a !important;
  }
  
  .ant-tabs-ink-bar {
    background: #2e186a !important;
    height: 3px !important;
    border-radius: 3px 3px 0 0;
  }
`;

const { TabPane } = Tabs;

const Sort: React.FC = () => {
  return (
    <SortWrapper>
      <Tabs defaultActiveKey="1" size="large" centered>
        <TabPane tab="🔢 Selection Sort" key="1">
          <SelectionSort />
        </TabPane>
        <TabPane tab="🔢 Insertion Sort" key="2">
          <InsertionSort />
        </TabPane>
        <TabPane tab="🔢 Shell Sort" key="3">
          <ShellSort />
        </TabPane>
        <TabPane tab="🔀 Merge Sort" key="4">
          <MergeSort />
        </TabPane>
      </Tabs>
    </SortWrapper>
  );
};

export default Sort;

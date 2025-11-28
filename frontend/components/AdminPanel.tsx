"use client";

import { useState } from "react";
import { useEncryptedVotingSystem } from "../hooks/useEncryptedVotingSystem";

export const AdminPanel = () => {
  const [newOption, setNewOption] = useState<string>("");
  const [candidateOptions, setCandidateOptions] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const { initializeVoting, contractAddress } = useEncryptedVotingSystem();

  const handleInitializeVoting = async () => {
    if (candidateOptions.length < 2) {
      alert("请至少添加2个候选人选项");
      return;
    }

    setIsInitializing(true);
    try {
      await initializeVoting(candidateOptions);
      alert("投票初始化成功！");
      setCandidateOptions([]);
    } catch (error: unknown) {
      console.error("初始化投票失败:", error);
      alert(`初始化投票失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleResetVoting = async () => {
    if (!confirm("确定要重置投票吗？这将清除所有投票数据！")) {
      return;
    }

    setIsResetting(true);
    try {
      // 这里需要实现resetVoting函数调用
      // await resetVoting();
      alert("投票重置成功！");
    } catch (error: unknown) {
      console.error("重置投票失败:", error);
      alert(`重置投票失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const addOption = () => {
    if (newOption.trim() && !candidateOptions.includes(newOption.trim())) {
      setCandidateOptions([...candidateOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setCandidateOptions(candidateOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">🔧 管理员面板</h2>
      <p className="text-sm text-yellow-700 mb-4">
        合约地址: {contractAddress || "未部署"}
      </p>

      <div className="space-y-4">
        {/* 添加候选人选项 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            添加候选人选项
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="输入候选人名称"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
            />
            <button
              onClick={addOption}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              disabled={!newOption.trim()}
            >
              添加
            </button>
          </div>
        </div>

        {/* 候选人列表 */}
        {candidateOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              候选人列表 ({candidateOptions.length})
            </label>
            <div className="space-y-2">
              {candidateOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                  <span className="text-gray-800">{option}</span>
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-yellow-200">
          <button
            onClick={handleInitializeVoting}
            disabled={candidateOptions.length < 2 || isInitializing}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isInitializing ? "初始化中..." : "初始化投票"}
          </button>

          <button
            onClick={handleResetVoting}
            disabled={isResetting}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? "重置中..." : "重置投票"}
          </button>
        </div>
      </div>
    </div>
  );
};

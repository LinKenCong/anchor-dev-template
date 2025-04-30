export interface RpcResponse {
  jsonrpc?: string;
  result?: {
    blockTime: number;
    meta: {
      computeUnitsConsumed: number;
      err: any;
      fee: number;
      innerInstructions: Array<{
        index: number;
        instructions: Array<{
          accounts: number[];
          data: string;
          programIdIndex: number;
          stackHeight: number;
        }>;
      }>;
      loadedAddresses: {
        readonly: string[];
        writable: string[];
      };
      logMessages: string[];
      postBalances: number[];
      postTokenBalances: Array<{
        accountIndex: number;
        mint: string;
        owner: string;
        programId: string;
        uiTokenAmount: {
          amount: string;
          decimals: number;
          uiAmount: number | null;
          uiAmountString: string;
        };
      }>;
      preBalances: number[];
      preTokenBalances: Array<{
        accountIndex: number;
        mint: string;
        owner: string;
        programId: string;
        uiTokenAmount: {
          amount: string;
          decimals: number;
          uiAmount: number | null;
          uiAmountString: string;
        };
      }>;
      rewards: any[];
      status: {
        Ok: any;
      };
    };
    slot: number;
    transaction: [string, "base64"];
    version: string;
  };
  id?: number;
}

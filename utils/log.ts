import { getTransactionRawCode, sleep, sliceRawCode } from "./tools";

// 交易日志
export const explorerLog = (title: string, signature: string, rpcEndpoint: string) =>
  console.log(`[ 🌐 Explorer]<${title}> https://solscan.io/tx/${signature}?cluster=custom&customUrl=${rpcEndpoint}`);

// 账户日志
export const accountLog = (title: string, key: string) => console.log(`[ 🔑 Account]<${title}> ${key}`);

// 代币余额日志
export const tokenBalanceLog = (title: string, tokenName: string, role: string, balance: string) =>
  console.log(`[ 💰 ${tokenName} Token Balance]<${title}> ${role}: ${balance}`);

// 表格日志
export const tableLog = (title: string, data: any) => {
  console.log(`[ 📊 Table]<${title}>`);

  if (typeof data === "object" && data !== null) {
    // 创建一个新对象以存储格式化后的数据
    const formattedData: Record<string, any> = {};

    // 遍历原始数据的每个键值对
    for (const [key, value] of Object.entries(data)) {
      // 检查是否是BN (BigNumber)对象
      if (
        value &&
        typeof value === "object" &&
        value.toString &&
        value.constructor &&
        (value.constructor.name === "BN" ||
          value.toString().includes("<BN:") ||
          Object.prototype.toString.call(value) === "[object BN]")
      ) {
        // 获取BN对象的值，避免调用toString(16)
        let hexValue = "";
        let decValue = 0;

        // 从BN对象的字符串表示中提取值
        const bnString = value.toString();
        const bnMatch = bnString.match(/<BN:\s*([0-9a-fA-F]+)>/);

        if (bnMatch && bnMatch[1]) {
          // 从<BN: 64>格式提取
          hexValue = bnMatch[1];
          // 转换为十进制
          decValue = parseInt(hexValue, 16);
        } else {
          // 直接使用toString()结果
          hexValue = bnString;

          // 检查是否为十六进制格式
          if (/^[0-9a-fA-F]+$/.test(hexValue)) {
            decValue = parseInt(hexValue, 16);
          } else {
            // 可能已经是十进制字符串
            decValue = parseInt(hexValue, 10);
            // 转回十六进制表示
            hexValue = decValue.toString(16);
          }
        }

        if (key.toLowerCase().includes("time")) {
          // 时间戳字段，转换为时间日期
          const date = new Date(decValue * 1000).toLocaleString();
          formattedData[key] = `${hexValue} (${date})`;
        } else {
          // 其他数值字段
          formattedData[key] = `${hexValue} (${decValue})`;
        }
      } else if (typeof value === "string") {
        // 处理字符串值，尝试检测十六进制格式
        if (/^[0-9a-fA-F]+$/.test(value)) {
          // 可能是十六进制字符串
          const hexValue = value;
          const decValue = parseInt(hexValue, 16);

          if (key.toLowerCase().includes("time")) {
            // 时间戳字段
            const date = new Date(decValue * 1000).toLocaleString();
            formattedData[key] = `${hexValue} (${date})`;
          } else {
            // 其他十六进制字段
            formattedData[key] = `${hexValue} (${decValue})`;
          }
        } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          // 带引号的字符串，去除引号
          const cleanValue = value.substring(1, value.length - 1);

          // 检查清除引号后是否是十六进制
          if (/^[0-9a-fA-F]+$/.test(cleanValue)) {
            const decValue = parseInt(cleanValue, 16);

            if (key.toLowerCase().includes("time")) {
              const date = new Date(decValue * 1000).toLocaleString();
              formattedData[key] = `${cleanValue} (${date})`;
            } else {
              formattedData[key] = `${cleanValue} (${decValue})`;
            }
          } else {
            formattedData[key] = cleanValue;
          }
        } else {
          // 普通字符串
          formattedData[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        // 其它对象类型
        try {
          formattedData[key] = JSON.stringify(value);
        } catch (e) {
          formattedData[key] = `[Object: ${value.constructor?.name || "Unknown"}]`;
        }
      } else {
        // 其他类型直接使用
        formattedData[key] = value;
      }
    }

    console.table(formattedData);
  } else {
    console.table(data);
  }
};

// 获取交易字节码日志
export const getTransactionRawCodeLog = async (rpcEndpoint: string, tx: string) => {
  await sleep(5);
  const rawCode = await getTransactionRawCode(rpcEndpoint, tx);
  if (rawCode === null) {
    console.error(`获取交易 ${tx} 的字节码失败, 请检查交易ID是否正确或 ${rpcEndpoint} 网络连接是否正常`);
    return null;
  }
  sliceRawCode(rawCode);
};

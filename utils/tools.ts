import * as anchor from '@coral-xyz/anchor';
import { RpcResponse } from './types';
import { base64 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { getOrCreateAssociatedTokenAccount, transferChecked } from '@solana/spl-token';

export const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));

// 跳转区块
export const jumpBlock = async (provider: anchor.Provider, block: number) => {
  const now = await provider.connection.getSlot();
  const target = now + block;
  while (true) {
    const currentSlot = await provider.connection.getSlot();
    console.log(`current slot: ${currentSlot}`);
    if (currentSlot > target) {
      break;
    }
    await sleep(1);
  }
};

// 获取交易字节码
export const getTransactionRawCode = async (rpcEndpoint: string, tx: string) => {
  try {
    // 使用直接的JSON-RPC请求获取交易（与用户提供的格式相同）
    const rpcResponse: RpcResponse = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          tx,
          {
            encoding: 'base64',
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          },
        ],
      }),
    }).then((res) => res.json());

    if (!rpcResponse || !rpcResponse.result || !rpcResponse.result.transaction) {
      console.error('交易数据获取失败或格式不正确:', JSON.stringify(rpcResponse));
      return null;
    }

    const rawTx = rpcResponse.result.transaction[0];
    const rawCode = base64.decode(rawTx).toString('hex');
    return rawCode;
  } catch (error) {
    console.error('获取交易字节码失败:', error);
    return null;
  }
};

// Solana 公钥到Base58的转换函数
export const publicKeyToBase58 = (pubkeyHex: string): string => {
  try {
    // 将十六进制字符串转换为Buffer
    const pubkeyBuffer = Buffer.from(pubkeyHex, 'hex');

    // 使用PublicKey类进行转换
    const publicKey = new anchor.web3.PublicKey(pubkeyBuffer);

    // 返回Base58编码的公钥
    return publicKey.toBase58();
  } catch (error) {
    console.error(`转换公钥失败: ${pubkeyHex}`, error);
    return '无效公钥';
  }
};

export const sliceRawCode = (rawCode: string | null) => {
  console.log('--------------- sliceRawCode -----------------');
  console.log(`Raw Transaction: ${rawCode}`);
  console.log('\nDecoded Transaction:');

  if (rawCode === null) {
    console.error('无法解析交易：原始交易数据为空');
    return null;
  }

  let currentIndex = 0;

  // 解析签名部分
  const signatureLengthText = rawCode.slice(0, 2);
  const signatureLength = parseInt(signatureLengthText, 16);
  console.log(`signature.length(签名长度): ${signatureLength} [字节长度: ${2}]`);
  currentIndex += 2;

  // 解析签名列表
  const signatureList = [];
  for (let i = 0; i < signatureLength; i++) {
    const start = currentIndex;
    const end = start + 128;
    const signature = rawCode.slice(start, end);
    console.log(`signature.${i}(签名): ${signature} [字节长度: ${128}]`);
    signatureList.push(signature);
    currentIndex += 128;
  }

  // 解析消息头部
  const numRequiredSignatures = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
  console.log(`message.header.numRequiredSignatures(消息头签名数量): ${numRequiredSignatures} [字节长度: ${2}]`);
  currentIndex += 2;

  const numReadonlySignedAccounts = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
  console.log(
    `message.header.numReadonlySignedAccounts(消息头只读签名账户数量): ${numReadonlySignedAccounts} [字节长度: ${2}]`,
  );
  currentIndex += 2;

  const numReadonlyUnsignedAccounts = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
  console.log(
    `message.header.numReadonlyUnsignedAccounts(消息头只读未签名账户数量): ${numReadonlyUnsignedAccounts} [字节长度: ${2}]`,
  );
  currentIndex += 2;

  // 解析账户密钥数量
  const accountKeysLength = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
  console.log(`message.header.accountKeys.length(消息头账户密钥数量): ${accountKeysLength} [字节长度: ${2}]`);
  currentIndex += 2;

  // 解析账户公钥
  const accountKeys = [];
  for (let i = 0; i < accountKeysLength; i++) {
    const start = currentIndex;
    const end = start + 64;
    const pubkeyHex = rawCode.slice(start, end);
    const pubkeyBase58 = publicKeyToBase58(pubkeyHex);
    console.log(`message.header.accountKeys.${i}(账户公钥): ${pubkeyBase58} [字节长度: ${64}]`);
    accountKeys.push({ hex: pubkeyHex, base58: pubkeyBase58 });
    currentIndex += 64;
  }

  // 解析最近区块哈希
  const recentBlockhash = rawCode.slice(currentIndex, currentIndex + 64);
  console.log(`message.header.recentBlockhash(最近区块哈希): ${recentBlockhash} [字节长度: ${64}]`);
  currentIndex += 64;

  // 解析指令数量
  const instructionsLength = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
  console.log(`message.instructions.length(指令数量): ${instructionsLength} [字节长度: ${2}]`);
  currentIndex += 2;

  // 解析指令
  for (let i = 0; i < instructionsLength; i++) {
    // 程序ID索引
    const programIdIndex = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
    console.log(`message.instructions.${i}.programIdIndex(程序ID索引): ${programIdIndex} [字节长度: ${2}]`);
    currentIndex += 2;

    // 账户数量
    const accountsLength = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
    console.log(`message.instructions.${i}.accounts.length(账户数量): ${accountsLength} [字节长度: ${2}]`);
    currentIndex += 2;

    // 账户列表
    for (let j = 0; j < accountsLength; j++) {
      const accountIndex = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
      console.log(`message.instructions.${i}.accounts.${j}.index(账户索引): ${accountIndex} [字节长度: ${2}]`);
      currentIndex += 2;
    }

    // 数据长度
    const dataLength = parseInt(rawCode.slice(currentIndex, currentIndex + 2), 16);
    console.log(`message.instructions.${i}.data.length(数据长度): ${dataLength} [字节长度: ${2}]`);
    currentIndex += 2;

    // 数据
    const data = rawCode.slice(currentIndex, currentIndex + dataLength * 2);
    console.log(`message.instructions.${i}.data(数据): ${data} [字节长度: ${dataLength * 2}]`);
    currentIndex += dataLength * 2;
  }

  console.log('--------------- sliceRawCode -----------------');
  return {
    signatureLength,
    signatureList,
    numRequiredSignatures,
    numReadonlySignedAccounts,
    numReadonlyUnsignedAccounts,
    accountKeys,
    recentBlockhash,
  };
};

// 空投( connection requestAirdrop )
export const airDrop = async (provider: anchor.Provider, key: anchor.web3.PublicKey, amount: number = 1000000000) => {
  await provider.connection.requestAirdrop(key, amount);
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

// 空投代币( provider transfer to )
export const airDropToken = async (
  provider: anchor.Provider,
  mintPda: anchor.web3.PublicKey,
  to: anchor.web3.PublicKey,
  amount: number = 1000000,
) => {
  // 创建关联代币账户
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mintPda,
    provider.wallet.publicKey,
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mintPda,
    to,
  );

  const tx = await transferChecked(
    provider.connection,
    provider.wallet.payer,
    fromTokenAccount.address,
    mintPda,
    toTokenAccount.address,
    provider.wallet.publicKey,
    amount,
    6,
  );
  return tx;
};

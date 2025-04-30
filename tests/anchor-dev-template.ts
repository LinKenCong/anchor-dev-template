import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorDevTemplate } from "../target/types/anchor_dev_template";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import * as assert from "assert";
import { log, tools } from "../utils";

describe("anchor-dev-template", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const program = anchor.workspace.anchorDevTemplate as Program<AnchorDevTemplate>;

  /* ============================== 全局变量 ============================== */
  // 测试账户
  const USER_1_KEYPAIR = anchor.web3.Keypair.generate();
  const USER_2_KEYPAIR = anchor.web3.Keypair.generate();
  const USER_3_KEYPAIR = anchor.web3.Keypair.generate();

  // PDA
  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("mint")], program.programId);
  before(async () => {
    // 为测试账户空投代币
    await tools.airDrop(provider, USER_1_KEYPAIR.publicKey);
  });
  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});

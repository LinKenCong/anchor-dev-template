#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("BUpZibsE5risenFGFjhN6aNYtL9AH9TvD2d6TDUisj7W");

#[program]
pub mod anchor_dev_template {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

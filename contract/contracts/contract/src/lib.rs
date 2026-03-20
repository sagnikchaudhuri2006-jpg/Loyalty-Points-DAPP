#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
pub enum DataKey {
    Balance(Address),
    TotalEarned(Address),
    TotalRedeemed(Address),
}

const POINTS_PURCHASE: i128 = 100;
const POINTS_REFERRAL: i128 = 200;
const POINTS_REVIEW: i128 = 50;
const POINTS_DEFAULT: i128 = 10;

fn get_action_points(env: &Env, action: &String) -> i128 {
    if action == &String::from_str(env, "purchase") {
        POINTS_PURCHASE
    } else if action == &String::from_str(env, "referral") {
        POINTS_REFERRAL
    } else if action == &String::from_str(env, "review") {
        POINTS_REVIEW
    } else {
        POINTS_DEFAULT
    }
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn earn(env: Env, user: Address, action: String) {
        user.require_auth();
        let points = get_action_points(&env, &action);

        let key = DataKey::Balance(user.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(current + points));

        let earned_key = DataKey::TotalEarned(user.clone());
        let total: i128 = env.storage().persistent().get(&earned_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&earned_key, &(total + points));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: u32) {
        from.require_auth();
        let amount_i128: i128 = amount.into();

        let key = DataKey::Balance(from.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        assert!(current >= amount_i128, "insufficient points");

        env.storage()
            .persistent()
            .set(&key, &(current - amount_i128));

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&to_key, &(to_balance + amount_i128));
    }

    pub fn redeem(env: Env, user: Address, amount: u32) {
        user.require_auth();
        let amount_i128: i128 = amount.into();

        let key = DataKey::Balance(user.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        assert!(current >= amount_i128, "insufficient points");

        env.storage()
            .persistent()
            .set(&key, &(current - amount_i128));

        let redeemed_key = DataKey::TotalRedeemed(user.clone());
        let total: i128 = env.storage().persistent().get(&redeemed_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&redeemed_key, &(total + amount_i128));
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }

    pub fn total_earned(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalEarned(user))
            .unwrap_or(0)
    }

    pub fn total_redeemed(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalRedeemed(user))
            .unwrap_or(0)
    }
}

mod test;

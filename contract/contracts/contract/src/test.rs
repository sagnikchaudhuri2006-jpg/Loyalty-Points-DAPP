#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String};

#[test]
fn test_earn_points_for_action() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // purchase earns 100 points
    client.earn(&user, &String::from_str(&env, "purchase"));
    assert_eq!(client.balance(&user), 100);

    // referral earns 200 points
    client.earn(&user, &String::from_str(&env, "referral"));
    assert_eq!(client.balance(&user), 300);

    // review earns 50 points
    client.earn(&user, &String::from_str(&env, "review"));
    assert_eq!(client.balance(&user), 350);
}

#[test]
fn test_earn_multiple_users_independent() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.earn(&alice, &String::from_str(&env, "purchase"));
    client.earn(&bob, &String::from_str(&env, "referral"));

    assert_eq!(client.balance(&alice), 100);
    assert_eq!(client.balance(&bob), 200);
}

#[test]
fn test_transfer_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.earn(&alice, &String::from_str(&env, "referral")); // 200 pts
    client.transfer(&alice, &bob, &150u32);

    assert_eq!(client.balance(&alice), 50);
    assert_eq!(client.balance(&bob), 150);
}

#[test]
#[should_panic(expected = "insufficient points")]
fn test_transfer_insufficient_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.earn(&alice, &String::from_str(&env, "purchase")); // 100 pts
    client.transfer(&alice, &bob, &200u32); // should panic
}

#[test]
fn test_redeem_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    client.earn(&user, &String::from_str(&env, "purchase")); // 100
    client.earn(&user, &String::from_str(&env, "referral")); // 200 → total 300
    client.redeem(&user, &250u32);

    assert_eq!(client.balance(&user), 50);
    assert_eq!(client.total_redeemed(&user), 250);
}

#[test]
#[should_panic(expected = "insufficient points")]
fn test_redeem_insufficient_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    client.earn(&user, &String::from_str(&env, "review")); // 50 pts
    client.redeem(&user, &100u32); // should panic
}

#[test]
fn test_total_earned_tracks_all_time_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    client.earn(&user, &String::from_str(&env, "purchase")); // 100
    client.earn(&user, &String::from_str(&env, "referral")); // 200
    client.redeem(&user, &150u32);

    assert_eq!(client.total_earned(&user), 300);
    assert_eq!(client.balance(&user), 150);
    assert_eq!(client.total_redeemed(&user), 150);
}

#[test]
fn test_balance_zero_for_new_user() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    assert_eq!(client.balance(&user), 0);
    assert_eq!(client.total_earned(&user), 0);
    assert_eq!(client.total_redeemed(&user), 0);
}

#[test]
fn test_unknown_action_earns_default_points() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    client.earn(&user, &String::from_str(&env, "signup"));
    assert_eq!(client.balance(&user), 10); // default 10 pts
}

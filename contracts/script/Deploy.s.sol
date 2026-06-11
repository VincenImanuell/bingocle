// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {EventFactory} from "../src/EventFactory.sol";
import {WordPool} from "../src/WordPool.sol";
import {WordMarket} from "../src/WordMarket.sol";
import {OracleRegistry} from "../src/OracleRegistry.sol";
import {BingoCardNFT} from "../src/BingoCardNFT.sol";
import {RewardVault} from "../src/RewardVault.sol";
import {AgentIdentity} from "../src/AgentIdentity.sol";

/// @notice Deploy + wire the full Bingocle suite on Mantle and register the AI
///         oracle's ERC-8004 identity.
///
/// Env:
///   PRIVATE_KEY    deployer (becomes owner of the ownable modules)
///   AGENT_ADDRESS  the AI agent wallet (oracle operator + word-pool curator);
///                  defaults to the deployer.
///
/// Run:
///   forge script script/Deploy.s.sol --rpc-url mantle_sepolia --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address agent = vm.envOr("AGENT_ADDRESS", deployer);

        vm.startBroadcast(pk);

        AgentIdentity agentIdentity = new AgentIdentity(deployer);
        EventFactory factory = new EventFactory(deployer);
        WordPool wordPool = new WordPool(deployer, address(factory));
        WordMarket wordMarket = new WordMarket(address(factory));
        OracleRegistry oracle = new OracleRegistry(deployer, address(factory));
        BingoCardNFT cardNFT = new BingoCardNFT(address(factory));
        RewardVault rewardVault = new RewardVault(address(factory));

        // wire the module registry on the factory (one-time)
        factory.wireModules(
            address(wordPool),
            address(wordMarket),
            address(oracle),
            address(cardNFT),
            address(rewardVault),
            address(agentIdentity)
        );

        // OracleRegistry is the only writer of agent reputation
        agentIdentity.setUpdater(address(oracle));
        // register the AI Validation Oracle as an ERC-8004 identity NFT
        agentIdentity.registerAgent(agent, "ipfs://bingocle-oracle-agent");
        // the agent wallet is also the AI Curator that commits word pools
        wordPool.setCurator(agent);

        vm.stopBroadcast();

        console2.log("AGENT_IDENTITY_ADDRESS=", address(agentIdentity));
        console2.log("EVENT_FACTORY_ADDRESS=", address(factory));
        console2.log("WORD_POOL_ADDRESS=", address(wordPool));
        console2.log("WORD_MARKET_ADDRESS=", address(wordMarket));
        console2.log("ORACLE_REGISTRY_ADDRESS=", address(oracle));
        console2.log("BINGO_CARD_NFT_ADDRESS=", address(cardNFT));
        console2.log("REWARD_VAULT_ADDRESS=", address(rewardVault));
    }
}

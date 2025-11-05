// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";
import "./Ownable.sol";
import "./ReentrancyGuard.sol";

/**
 * @title TrancheStaker
 * @dev A staking contract for Tranche tokens with multiple staking durations and dynamic APY
 */
contract TrancheStaker is Ownable, ReentrancyGuard {

    // Tranche token contract
    IERC20 public trancheToken;

    // Staking pool durations in seconds
    uint256 public constant WEEK_1 = 1 weeks;
    uint256 public constant WEEK_4 = 4 weeks;
    uint256 public constant WEEK_12 = 12 weeks;
    uint256 public constant WEEK_24 = 24 weeks;
    uint256 public constant WEEK_52 = 52 weeks;
    uint256 public constant MAX_DURATION = 104 weeks; // 2 years

    // Pool caps in tokens (with 18 decimals)
    uint256 public constant POOL_CAP_1_WEEK = 10_000_000 * 10**18;
    uint256 public constant POOL_CAP_4_WEEK = 18_000_000 * 10**18;
    uint256 public constant POOL_CAP_12_WEEK = 21_000_000 * 10**18;
    uint256 public constant POOL_CAP_24_WEEK = 24_000_000 * 10**18;
    uint256 public constant POOL_CAP_52_WEEK = 30_000_000 * 10**18;

    // Total reward tokens to be distributed (100 million)
    uint256 public constant TOTAL_REWARD_TOKENS = 100_000_000 * 10**18;
    
    // Reward update interval
    uint256 public constant REWARD_UPDATE_INTERVAL = 10 seconds;

    // Staking pool information
    struct Pool {
        uint256 duration;
        uint256 totalStaked;
        uint256 cap;
        uint256 lastUpdateTime;
    }

    // User stake information
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastClaimTime;
        uint256 duration;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    // Mapping of duration to pool info
    mapping(uint256 => Pool) public pools;
    
    // Mapping of user address to duration to stake info
    mapping(address => mapping(uint256 => Stake)) public userStakes;
    
    // Array of all staking durations
    uint256[] public stakingDurations;
    
    // Total staked amount across all pools
    uint256 public totalStaked;
    
    // Total rewards distributed
    uint256 public totalRewardsDistributed;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount, uint256 duration);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardCalculated(address indexed user, uint256 amount, uint256 duration);

    /**
     * @dev Constructor to initialize the contract with the Tranche token address
     * @param _trancheToken Address of the Tranche token contract
     */
    constructor(address _trancheToken) Ownable(msg.sender) {
        require(_trancheToken != address(0), "Invalid token address");
        trancheToken = IERC20(_trancheToken);
        
        // Initialize staking pools
        stakingDurations = [WEEK_1, WEEK_4, WEEK_12, WEEK_24, WEEK_52, MAX_DURATION];
        
        pools[WEEK_1] = Pool({
            duration: WEEK_1,
            totalStaked: 0,
            cap: POOL_CAP_1_WEEK,
            lastUpdateTime: block.timestamp
        });
        
        pools[WEEK_4] = Pool({
            duration: WEEK_4,
            totalStaked: 0,
            cap: POOL_CAP_4_WEEK,
            lastUpdateTime: block.timestamp
        });
        
        pools[WEEK_12] = Pool({
            duration: WEEK_12,
            totalStaked: 0,
            cap: POOL_CAP_12_WEEK,
            lastUpdateTime: block.timestamp
        });
        
        pools[WEEK_24] = Pool({
            duration: WEEK_24,
            totalStaked: 0,
            cap: POOL_CAP_24_WEEK,
            lastUpdateTime: block.timestamp
        });
        
        pools[WEEK_52] = Pool({
            duration: WEEK_52,
            totalStaked: 0,
            cap: POOL_CAP_52_WEEK,
            lastUpdateTime: block.timestamp
        });
        
        pools[MAX_DURATION] = Pool({
            duration: MAX_DURATION,
            totalStaked: 0,
            cap: 0, // No cap for MAX_DURATION
            lastUpdateTime: block.timestamp
        });
    }

    /**
     * @dev Stake tokens for a specific duration
     * @param amount Amount of tokens to stake
     * @param duration Duration of staking (must be one of the predefined durations)
     */
    function stake(uint256 amount, uint256 duration) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(isValidDuration(duration), "Invalid staking duration");
        
        Pool storage pool = pools[duration];
        
        // Check if pool has a cap and if it would be exceeded
        if (pool.cap > 0) {
            require(pool.totalStaked + amount <= pool.cap, "Pool cap exceeded");
        }
        
        // Transfer tokens from user to contract
        require(trancheToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update user stake
        Stake storage userStake = userStakes[msg.sender][duration];
        
        // If user already has a stake in this pool, calculate pending rewards first
        if (userStake.amount > 0) {
            userStake.pendingRewards = calculateRewards(msg.sender, duration);
        }
        
        // Update user stake information
        userStake.amount = userStake.amount + amount;
        userStake.startTime = block.timestamp;
        userStake.endTime = block.timestamp + duration;
        userStake.lastClaimTime = block.timestamp;
        userStake.duration = duration;
        
        // Update pool information
        pool.totalStaked = pool.totalStaked + amount;
        pool.lastUpdateTime = block.timestamp;
        
        // Update total staked amount
        totalStaked = totalStaked + amount;
        
        emit Staked(msg.sender, amount, duration);
    }

    /**
     * @dev Unstake tokens after the lock period has ended
     * @param duration Duration of the staking pool to unstake from
     */
    function unstake(uint256 duration) external nonReentrant {
        require(isValidDuration(duration), "Invalid staking duration");
        
        Stake storage userStake = userStakes[msg.sender][duration];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.endTime, "Staking period not ended");
        
        // Calculate final rewards
        uint256 pendingRewards = calculateRewards(msg.sender, duration);
        
        // Get staked amount
        uint256 stakedAmount = userStake.amount;
        
        // Reset user stake
        userStake.amount = 0;
        userStake.pendingRewards = 0;
        userStake.rewardDebt = 0;
        
        // Update pool information
        Pool storage pool = pools[duration];
        pool.totalStaked = pool.totalStaked - stakedAmount;
        pool.lastUpdateTime = block.timestamp;
        
        // Update total staked amount
        totalStaked = totalStaked - stakedAmount;
        
        // Transfer staked tokens back to user
        require(trancheToken.transfer(msg.sender, stakedAmount), "Token transfer failed");
        
        // Transfer rewards to user
        if (pendingRewards > 0) {
            require(trancheToken.transfer(msg.sender, pendingRewards), "Reward transfer failed");
            totalRewardsDistributed = totalRewardsDistributed + pendingRewards;
            emit RewardClaimed(msg.sender, pendingRewards);
        }
        
        emit Unstaked(msg.sender, stakedAmount, duration);
    }

    /**
     * @dev Claim pending rewards without unstaking
     * @param duration Duration of the staking pool to claim rewards from
     */
    function claimRewards(uint256 duration) external nonReentrant {
        require(isValidDuration(duration), "Invalid staking duration");
        
        Stake storage userStake = userStakes[msg.sender][duration];
        require(userStake.amount > 0, "No stake found");
        
        // Calculate pending rewards
        uint256 pendingRewards = calculateRewards(msg.sender, duration);
        require(pendingRewards > 0, "No rewards to claim");
        
        // Update last claim time
        userStake.lastClaimTime = block.timestamp;
        userStake.pendingRewards = 0;
        userStake.rewardDebt = 0;
        
        // Transfer rewards to user
        require(trancheToken.transfer(msg.sender, pendingRewards), "Reward transfer failed");
        totalRewardsDistributed = totalRewardsDistributed + pendingRewards;
        
        emit RewardClaimed(msg.sender, pendingRewards);
    }

    /**
     * @dev Calculate pending rewards for a user in a specific staking pool
     * @param user Address of the user
     * @param duration Duration of the staking pool
     * @return Pending rewards amount
     */
    function calculateRewards(address user, uint256 duration) public returns (uint256) {
        Stake storage userStake = userStakes[user][duration];
        Pool storage pool = pools[duration];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        // Calculate time since last claim
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        
        // Calculate rewards based on staked amount, pool total, and time elapsed
        uint256 userShare = userStake.amount * 1e18 / pool.totalStaked;
        
        // Calculate annual reward for this pool based on duration
        uint256 annualRewardForPool = getAnnualRewardForDuration(duration);
        
        // Calculate reward for the elapsed time
        uint256 reward = annualRewardForPool * userShare / 1e18 * timeElapsed / 365 days;
        
        // Add to pending rewards
        uint256 totalPendingRewards = userStake.pendingRewards + reward;
        
        // Update pending rewards in storage
        userStake.pendingRewards = totalPendingRewards;
        userStake.lastClaimTime = block.timestamp;
        
        emit RewardCalculated(user, totalPendingRewards, duration);
        
        return totalPendingRewards;
    }

    // getPendingRewards function moved above

    /**
     * @dev Get annual reward allocation for a specific duration
     * @param duration Duration of the staking pool
     * @return Annual reward allocation
     */
    function getAnnualRewardForDuration(uint256 duration) public view returns (uint256) {
        // Rewards are directly proportional to staking duration
        if (duration == WEEK_1) {
            return 10_000_000 * 10**18; // 10M tokens for 1 week pool (annualized)
        } else if (duration == WEEK_4) {
            return 18_000_000 * 10**18; // 18M tokens for 4 week pool (annualized)
        } else if (duration == WEEK_12) {
            return 21_000_000 * 10**18; // 21M tokens for 12 week pool (annualized)
        } else if (duration == WEEK_24) {
            return 24_000_000 * 10**18; // 24M tokens for 24 week pool (annualized)
        } else if (duration == WEEK_52) {
            return 30_000_000 * 10**18; // 30M tokens for 52 week pool (annualized)
        } else if (duration == MAX_DURATION) {
            return 40_000_000 * 10**18; // 40M tokens for MAX_DURATION pool (annualized)
        } else {
            return 0; // Invalid duration
        }
    }

    /**
     * @dev Withdraw all staked tokens and rewards (emergency function)
     */
    function withdrawAll() external nonReentrant {
        uint256 totalAmount = 0;
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < stakingDurations.length; i++) {
            uint256 duration = stakingDurations[i];
            Stake storage userStake = userStakes[msg.sender][duration];
            
            if (userStake.amount > 0) {
                // Calculate rewards
                uint256 pendingRewards = calculateRewards(msg.sender, duration);
                totalRewards = totalRewards + pendingRewards;
                
                // Add staked amount
                totalAmount = totalAmount + userStake.amount;
                
                // Update pool information
                Pool storage pool = pools[duration];
                pool.totalStaked = pool.totalStaked - userStake.amount;
                
                // Reset user stake
                userStake.amount = 0;
                userStake.pendingRewards = 0;
                userStake.rewardDebt = 0;
                
                emit Unstaked(msg.sender, userStake.amount, duration);
            }
        }
        
        // Update total staked amount
        totalStaked = totalStaked - totalAmount;
        
        // Transfer tokens back to user
        if (totalAmount > 0) {
            require(trancheToken.transfer(msg.sender, totalAmount), "Token transfer failed");
        }
        
        // Transfer rewards to user
        if (totalRewards > 0) {
            require(trancheToken.transfer(msg.sender, totalRewards), "Reward transfer failed");
            totalRewardsDistributed = totalRewardsDistributed + totalRewards;
            emit RewardClaimed(msg.sender, totalRewards);
        }
    }

    /**
     * @dev Get pending rewards for a user in a specific staking pool (view function)
     * @param user Address of the user
     * @param duration Duration of the staking pool
     * @return Pending rewards amount
     */
    function getPendingRewards(address user, uint256 duration) public view returns (uint256) {
        Stake storage userStake = userStakes[user][duration];
        Pool storage pool = pools[duration];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        // Start with existing pending rewards
        uint256 pendingRewards = userStake.pendingRewards;
        
        // Calculate time since last claim
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        
        // Calculate rewards based on staked amount, pool total, and time elapsed
        uint256 userShare = userStake.amount * 1e18 / pool.totalStaked;
        
        // Calculate annual reward for this pool based on duration
        uint256 annualRewardForPool = getAnnualRewardForDuration(duration);
        
        // Calculate reward for the elapsed time
        uint256 reward = annualRewardForPool * userShare / 1e18 * timeElapsed / 365 days;
        
        return pendingRewards + reward;
    }

    /**
     * @dev Check if a duration is valid
     * @param duration Duration to check
     * @return True if the duration is valid
     */
    function isValidDuration(uint256 duration) public view returns (bool) {
        for (uint256 i = 0; i < stakingDurations.length; i++) {
            if (stakingDurations[i] == duration) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get user stake information
     * @param user Address of the user
     * @param duration Duration of the staking pool
     * @return amount Staked amount
     * @return startTime Start time of the stake
     * @return endTime End time of the stake
     * @return pendingRewards Pending rewards
     */
    function getUserStakeInfo(address user, uint256 duration) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        uint256 pendingRewards
    ) {
        Stake storage userStake = userStakes[user][duration];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.endTime,
            getPendingRewards(user, duration)
        );
    }

    /**
     * @dev Get pool information
     * @param duration Duration of the staking pool
     * @return poolTotalStaked Total staked amount in the pool
     * @return cap Cap of the pool
     */
    function getPoolInfo(uint256 duration) external view returns (
        uint256 poolTotalStaked,
        uint256 cap
    ) {
        Pool storage pool = pools[duration];
        return (
            pool.totalStaked,
            pool.cap
        );
    }

    /**
     * @dev Emergency withdraw function for owner to recover tokens
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}

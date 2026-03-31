const API_BASE_URL = "https://namami-infotech.com/SANCHAR";
export const calculateWorkStatusForLOA = async (loa) => {
  console.log("Calculating work status for LOA:", loa);
  try {
    if (!loa) {
      throw new Error("LOA is required");
    }

    const response = await fetch(
      `${API_BASE_URL}/src/work-status/get_work_status.php?loa=${encodeURIComponent(
        loa,
      )}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to calculate statistics");
    }

    // If API returns array of records, calculate locally using calculateStatsFromData
    if (result.data && Array.isArray(result.data)) {
      return calculateStatsFromData(result.data);
    }

    // If API returns aggregated data, transform to match calculateStatsFromData format exactly
    return {
      success: true,
      data: {
        loa: result.data.loa || loa,
        totalWorkDone: result.data.total_work_done || 0,
        completedWorkDone: result.data.completed_work_done || 0,
        pendingWorkDone: result.data.pending_work_done || 0,
        totalRMDone: result.data.total_rm_done || 0,
        completedRMDone: result.data.completed_rm_done || 0,
        pendingRMDone: result.data.pending_rm_done || 0,
        totalTXCount: parseFloat((result.data.total_tx_count || 0).toFixed(2)),
        totalRXCount: parseFloat((result.data.total_rx_count || 0).toFixed(2)),
        totalTXAmount: parseFloat(
          (result.data.total_tx_amount || 0).toFixed(2),
        ),
        totalRXAmount: parseFloat(
          (result.data.total_rx_amount || 0).toFixed(2),
        ),
        totalAmount: parseFloat(
          (
            (result.data.total_tx_amount || 0) +
            (result.data.total_rx_amount || 0)
          ).toFixed(2),
        ),
        records: result.data.total_work_done || 0,
      },
    };
  } catch (error) {
    console.error("Error calculating work status:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

export const calculateWorkStatusForMultipleLOAs = async (loaList) => {
  try {
    if (!loaList || loaList.length === 0) {
      throw new Error("At least one LOA is required");
    }

    const loaString = loaList.map((loa) => encodeURIComponent(loa)).join(",");

    const response = await fetch(
      `${API_BASE_URL}/src/work-status/calculate_multiple_loa_stats.php?loas=${loaString}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to calculate statistics");
    }

    return {
      success: true,
      data: result.data.map((item) => ({
        loa: item.loa,
        totalWorkDone: item.total_work_done || 0,
        completedWorkDone: item.completed_work_done || 0,
        pendingWorkDone: item.pending_work_done || 0,
        totalRMDone: item.total_rm_done || 0,
        completedRMDone: item.completed_rm_done || 0,
        pendingRMDone: item.pending_rm_done || 0,
        totalTXCount: parseFloat((item.total_tx_count || 0).toFixed(2)),
        totalRXCount: parseFloat((item.total_rx_count || 0).toFixed(2)),
        totalTXAmount: parseFloat((item.total_tx_amount || 0).toFixed(2)),
        totalRXAmount: parseFloat((item.total_rx_amount || 0).toFixed(2)),
        totalAmount: parseFloat(
          ((item.total_tx_amount || 0) + (item.total_rx_amount || 0)).toFixed(
            2,
          ),
        ),
        records: item.total_work_done || 0,
      })),
    };
  } catch (error) {
    console.error("Error calculating work status for multiple LOAs:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

export const calculateWorkStatusWithFilters = async (filters) => {
  try {
    if (!filters || !filters.loa) {
      throw new Error("LOA is required in filters");
    }

    const queryParams = new URLSearchParams();
    queryParams.append("loa", filters.loa);

    if (filters.station) {
      queryParams.append("station", filters.station);
    }
    if (filters.rmStatus) {
      queryParams.append("rm_status", filters.rmStatus);
    }
    if (filters.workDoneStatus) {
      queryParams.append("work_done_status", filters.workDoneStatus);
    }

    const response = await fetch(
      `${API_BASE_URL}/src/work-status/calculate_loa_stats_filtered.php?${queryParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to calculate statistics");
    }

    return {
      success: true,
      data: {
        loa: result.data.loa,
        filters: filters,
        totalWorkDone: result.data.total_work_done || 0,
        completedWorkDone: result.data.completed_work_done || 0,
        pendingWorkDone: result.data.pending_work_done || 0,
        totalRMDone: result.data.total_rm_done || 0,
        completedRMDone: result.data.completed_rm_done || 0,
        pendingRMDone: result.data.pending_rm_done || 0,
        totalTXCount: parseFloat((result.data.total_tx_count || 0).toFixed(2)),
        totalRXCount: parseFloat((result.data.total_rx_count || 0).toFixed(2)),
        totalTXAmount: parseFloat(
          (result.data.total_tx_amount || 0).toFixed(2),
        ),
        totalRXAmount: parseFloat(
          (result.data.total_rx_amount || 0).toFixed(2),
        ),
        totalAmount: parseFloat(
          (
            (result.data.total_tx_amount || 0) +
            (result.data.total_rx_amount || 0)
          ).toFixed(2),
        ),
        records: result.data.total_work_done || 0,
      },
    };
  } catch (error) {
    console.error("Error calculating filtered work status:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};
export const calculateStatsFromData = (data) => {
  try {
    if (!data || !Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    if (data.length === 0) {
      return {
        success: true,
        data: {
          loa: "N/A",
          totalWorkDone: 0,
          completedWorkDone: 0,
          pendingWorkDone: 0,
          totalRMDone: 0,
          completedRMDone: 0,
          pendingRMDone: 0,
          totalTXCount: 0,
          totalRXCount: 0,
          totalTXAmount: 0,
          totalRXAmount: 0,
          totalAmount: 0,
          records: 0,
        },
      };
    }

    // Get LOA from first record
    const loa = data[0]?.loa || "N/A";

    // Calculate metrics
    const totalRecords = data.length;

    // Work Done Status metrics
    const completedWorkDone = data.filter(
      (item) =>
        item.work_done_status &&
        item.work_done_status.toLowerCase() === "complete",
    ).length;
    const pendingWorkDone = data.filter(
      (item) =>
        !item.work_done_status ||
        item.work_done_status.toLowerCase() === "pending",
    ).length;

    // RM Status metrics
    const completedRMDone = data.filter(
      (item) => item.rm_status && item.rm_status.toLowerCase() === "complete",
    ).length;
    const pendingRMDone = data.filter(
      (item) => !item.rm_status || item.rm_status.toLowerCase() === "pending",
    ).length;

    // TX/RX Count and Amount calculations
    let totalTXCount = 0;
    let totalRXCount = 0;
    let totalTXAmount = 0;
    let totalRXAmount = 0;

    data.forEach((item) => {
      const txQt = parseFloat(item.tx_qt) || 0;
      const rxQt = parseFloat(item.rx_qt) || 0;
      const txPrice = parseFloat(item.tx_unit_price) || 0;
      const rxPrice = parseFloat(item.rx_unit_price) || 0;

      totalTXCount += txQt;
      totalRXCount += rxQt;
      totalTXAmount += txQt * txPrice;
      totalRXAmount += rxQt * rxPrice;
    });

    const totalAmount = totalTXAmount + totalRXAmount;

    return {
      success: true,
      data: {
        loa: loa,
        totalWorkDone: totalRecords,
        completedWorkDone: completedWorkDone,
        pendingWorkDone: pendingWorkDone,
        totalRMDone: totalRecords,
        completedRMDone: completedRMDone,
        pendingRMDone: pendingRMDone,
        totalTXCount: parseFloat(totalTXCount.toFixed(2)),
        totalRXCount: parseFloat(totalRXCount.toFixed(2)),
        totalTXAmount: parseFloat(totalTXAmount.toFixed(2)),
        totalRXAmount: parseFloat(totalRXAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        records: totalRecords,
      },
    };
  } catch (error) {
    console.error("Error calculating stats from data:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

export default {
  calculateWorkStatusForLOA,
  calculateWorkStatusForMultipleLOAs,
  calculateWorkStatusWithFilters,
  calculateStatsFromData,
};

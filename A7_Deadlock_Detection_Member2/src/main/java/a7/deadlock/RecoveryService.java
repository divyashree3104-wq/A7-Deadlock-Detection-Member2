
package a7.deadlock;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Connects the recovery module to the dashboard.
 * Supports process termination and resource preemption.
 */
public final class RecoveryService {

    private RecoveryService() {}

    public record RecoveryResult(
            String method,
            int victim,
            int[] available,
            int[][] allocation,
            int[][] request,
            DeadlockDetection.Result detection,
            List<String> messages) {}

    public static RecoveryResult recover(
            int[] available,
            int[][] allocation,
            int[][] request,
            String method,
            int victim) {

        // Validate input using the existing detection algorithm.
        DeadlockDetection.Result before =
                DeadlockDetection.detect(available, allocation, request);

        if (!before.deadlock()) {
            throw new IllegalArgumentException(
                    "Recovery is not required. No deadlock detected.");
        }

        if (victim < 0 || victim >= allocation.length) {
            throw new IllegalArgumentException("Invalid victim process.");
        }

        if (!before.deadlockedProcesses().contains(victim)) {
            throw new IllegalArgumentException(
                    "Select a process identified as deadlocked.");
        }

        if (!"termination".equals(method)
                && !"preemption".equals(method)) {
            throw new IllegalArgumentException(
                    "Choose termination or preemption.");
        }

        // Work on copies so the original input is not modified.
        int[] newAvailable = Arrays.copyOf(available, available.length);
        int[][] newAllocation = copyMatrix(allocation);
        int[][] newRequest = copyMatrix(request);

        List<String> messages = new ArrayList<>();

        // Release the victim's allocated resources.
        for (int j = 0; j < newAvailable.length; j++) {
            newAvailable[j] += newAllocation[victim][j];
            newAllocation[victim][j] = 0;
        }

        if ("termination".equals(method)) {
            Arrays.fill(newRequest[victim], 0);
            messages.add("Process P" + victim + " terminated.");
            messages.add("Its allocated resources were released.");
        } else {
            messages.add("Resources preempted from P" + victim + ".");
            messages.add("The process remains active and may request resources again.");
        }

        messages.add("Updated Available = "
                + Arrays.toString(newAvailable));

        // Run the existing detection algorithm again.
        DeadlockDetection.Result after =
                DeadlockDetection.detect(
                        newAvailable, newAllocation, newRequest);

        messages.add(after.deadlock()
                ? "Deadlock still exists after recovery."
                : "Recovery successful. No deadlock remains.");

        return new RecoveryResult(
                method,
                victim,
                newAvailable,
                newAllocation,
                newRequest,
                after,
                List.copyOf(messages));
    }

    private static int[][] copyMatrix(int[][] matrix) {
        int[][] copy = new int[matrix.length][];

        for (int i = 0; i < matrix.length; i++) {
            copy[i] = Arrays.copyOf(matrix[i], matrix[i].length);
        }

        return copy;
    }
}

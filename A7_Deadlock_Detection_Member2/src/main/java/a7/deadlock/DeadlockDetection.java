package a7.deadlock;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Multiple-instance deadlock detection algorithm.
 * Request represents each process's outstanding resource request.
 */
public final class DeadlockDetection {
    private DeadlockDetection() {}

    public record Result(
            boolean deadlock,
            List<Integer> deadlockedProcesses,
            List<Integer> completionOrder,
            int[] finalWork,
            boolean[] finish,
            List<String> trace) {}

    public static Result detect(int[] available, int[][] allocation, int[][] request) {
        validate(available, allocation, request);

        int processCount = allocation.length;
        int resourceCount = available.length;
        int[] work = Arrays.copyOf(available, resourceCount);
        boolean[] finish = new boolean[processCount];
        List<Integer> completionOrder = new ArrayList<>();
        List<String> trace = new ArrayList<>();

        for (int i = 0; i < processCount; i++) {
            finish[i] = isZeroRow(allocation[i]);
        }

        trace.add("Initial Work = " + Arrays.toString(work)
                + "; Finish = " + Arrays.toString(finish));

        boolean progress;
        do {
            progress = false;
            for (int p = 0; p < processCount; p++) {
                if (!finish[p] && lessThanOrEqual(request[p], work)) {
                    trace.add("P" + p + " can proceed: Request "
                            + Arrays.toString(request[p]) + " <= Work "
                            + Arrays.toString(work));
                    for (int r = 0; r < resourceCount; r++) {
                        work[r] += allocation[p][r];
                    }
                    finish[p] = true;
                    completionOrder.add(p);
                    trace.add("P" + p + " finishes; releases Allocation "
                            + Arrays.toString(allocation[p]) + "; Work becomes "
                            + Arrays.toString(work));
                    progress = true;
                }
            }
        } while (progress);

        List<Integer> deadlocked = new ArrayList<>();
        for (int p = 0; p < processCount; p++) {
            if (!finish[p]) deadlocked.add(p);
        }

        trace.add(deadlocked.isEmpty()
                ? "All processes can finish. No deadlock detected."
                : "Unfinished processes: " + deadlocked + ". Deadlock detected.");

        return new Result(!deadlocked.isEmpty(), List.copyOf(deadlocked),
                List.copyOf(completionOrder), Arrays.copyOf(work, work.length),
                Arrays.copyOf(finish, finish.length), List.copyOf(trace));
    }

    private static boolean lessThanOrEqual(int[] request, int[] work) {
        for (int i = 0; i < request.length; i++) {
            if (request[i] > work[i]) return false;
        }
        return true;
    }

    private static boolean isZeroRow(int[] row) {
        for (int value : row) if (value != 0) return false;
        return true;
    }

    private static void validate(int[] available, int[][] allocation, int[][] request) {
        if (available == null || allocation == null || request == null)
            throw new IllegalArgumentException("Inputs cannot be null.");
        if (allocation.length == 0 || allocation.length != request.length)
            throw new IllegalArgumentException("Allocation and Request must have the same non-zero process count.");
        for (int value : available)
            if (value < 0) throw new IllegalArgumentException("Resource values cannot be negative.");
        for (int p = 0; p < allocation.length; p++) {
            if (allocation[p] == null || request[p] == null
                    || allocation[p].length != available.length
                    || request[p].length != available.length)
                throw new IllegalArgumentException("Every matrix row must match the resource count.");
            for (int value : allocation[p])
                if (value < 0) throw new IllegalArgumentException("Resource values cannot be negative.");
            for (int value : request[p])
                if (value < 0) throw new IllegalArgumentException("Resource values cannot be negative.");
        }
    }
}

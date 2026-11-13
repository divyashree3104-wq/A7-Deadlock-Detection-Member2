package a7.deadlock;

public class DetectionSelfTest {
    public static void main(String[] args) {
        var noDeadlock = DeadlockDetection.detect(
                new int[]{1, 1},
                new int[][]{{1, 0}, {0, 1}, {0, 0}},
                new int[][]{{0, 1}, {1, 0}, {1, 1}});
        check(!noDeadlock.deadlock(), "Expected no deadlock");

        var deadlock = DeadlockDetection.detect(
                new int[]{0, 0},
                new int[][]{{1, 0}, {0, 1}},
                new int[][]{{0, 1}, {1, 0}});
        check(deadlock.deadlock(), "Expected deadlock");
        check(deadlock.deadlockedProcesses().size() == 2, "Expected P0 and P1");

        var partial = DeadlockDetection.detect(
                new int[]{0, 0},
                new int[][]{{1, 0}, {0, 1}, {0, 0}},
                new int[][]{{0, 1}, {1, 0}, {0, 0}});
        check(partial.deadlock(), "Expected deadlock among allocated processes");
        System.out.println("PASS: 3 detection scenarios.");
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}

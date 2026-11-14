package deadlock;

import java.util.Scanner;

public class Recovery {

    static Scanner sc = new Scanner(System.in);

    static int n, m;

    static int[][] allocation;
    static int[][] request;
    static int[] available;

    // Deadlock detection algorithm
    static boolean detectDeadlock() {

        int[] work = available.clone();
        boolean[] finish = new boolean[n];

        for (int i = 0; i < n; i++) {
            finish[i] = true;

            for (int j = 0; j < m; j++) {
                if (allocation[i][j] != 0) {
                    finish[i] = false;
                    break;
                }
            }
        }

        boolean found;

        do {
            found = false;

            for (int i = 0; i < n; i++) {

                if (!finish[i]) {

                    boolean possible = true;

                    for (int j = 0; j < m; j++) {
                        if (request[i][j] > work[j]) {
                            possible = false;
                            break;
                        }
                    }

                    if (possible) {

                        for (int j = 0; j < m; j++) {
                            work[j] += allocation[i][j];
                        }

                        finish[i] = true;
                        found = true;
                    }
                }
            }

        } while (found);

        System.out.println("\nDeadlock Detection Result:");

        boolean deadlock = false;

        for (int i = 0; i < n; i++) {
            if (!finish[i]) {
                System.out.println("P" + (i + 1) + " is deadlocked");
                deadlock = true;
            }
        }

        if (!deadlock) {
            System.out.println("No deadlock detected.");
        }

        return deadlock;
    }

    // Display available resources
    static void displayAvailable() {

        System.out.print("\nAvailable Resources: ");

        for (int j = 0; j < m; j++) {
            System.out.print(available[j] + " ");
        }

        System.out.println();
    }

    // Process Termination
    static void processTermination(int victim) {

        System.out.println("\nTerminating Process P" + (victim + 1));

        for (int j = 0; j < m; j++) {

            available[j] += allocation[victim][j];

            allocation[victim][j] = 0;
            request[victim][j] = 0;
        }

        System.out.println("Process terminated successfully.");
        displayAvailable();
    }

    // Resource Preemption
    static void resourcePreemption(int victim) {

        System.out.println("\nPreempting resources from P" + (victim + 1));

        for (int j = 0; j < m; j++) {

            available[j] += allocation[victim][j];

            allocation[victim][j] = 0;
        }

        System.out.println("Resources preempted successfully.");
        displayAvailable();
    }

    // Main method
    public static void main(String[] args) {

        System.out.println("================================");
        System.out.println(" DEADLOCK RECOVERY SIMULATOR");
        System.out.println("================================");

        System.out.print("Enter number of processes: ");
        n = sc.nextInt();

        System.out.print("Enter number of resources: ");
        m = sc.nextInt();

        allocation = new int[n][m];
        request = new int[n][m];
        available = new int[m];

        // Allocation Matrix
        System.out.println("\nEnter Allocation Matrix:");

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                allocation[i][j] = sc.nextInt();
            }
        }

        // Request Matrix
        System.out.println("\nEnter Request Matrix:");

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                request[i][j] = sc.nextInt();
            }
        }

        // Available Resources
        System.out.println("\nEnter Available Resources:");

        for (int j = 0; j < m; j++) {
            available[j] = sc.nextInt();
        }

        // Initial Detection
        boolean deadlock = detectDeadlock();

        if (deadlock) {

            System.out.println("\nChoose Recovery Method:");
            System.out.println("1. Process Termination");
            System.out.println("2. Resource Preemption");

            System.out.print("Enter your choice: ");
            int choice = sc.nextInt();

            System.out.print("Select victim process (1 to " + n + "): ");
            int victim = sc.nextInt() - 1;

            if (victim < 0 || victim >= n) {
                System.out.println("Invalid victim process.");
                return;
            }

            if (choice == 1) {

                processTermination(victim);

            } else if (choice == 2) {

                resourcePreemption(victim);

            } else {

                System.out.println("Invalid choice.");
                return;
            }

            // Run detection again
            System.out.println("\nRunning Deadlock Detection Again...");

            detectDeadlock();

        } else {

            System.out.println("\nSystem is in a safe state.");
        }

        System.out.println("\nDeadlock Recovery Module Completed.");
    }
}

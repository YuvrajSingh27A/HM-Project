import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        try {
            int num1 = scanner.nextInt();
            int num2 = scanner.nextInt();
            int sum = num1 * num2;
            System.out.println(sum);
        } catch (Exception e) {
            System.out.println("Error: " + e);
        } finally {
            scanner.close();
        }
    }
}
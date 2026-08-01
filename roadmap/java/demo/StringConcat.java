public class StringConcat {

public static void main(String[] args) {

    int[] v1 = { -4, -4, 0, -4, 2 };
    int[] v2 = { -8, -6, 0, -4, 2, 9, 15 };
    int[] v = concatenateArrays(v1, v2);
    printArray(v);  // -4 -4 0 -4 2 -8, -6, 0, -4, 2, 9, 15
    }

    public static int[] concatenateArrays(int[] a, int[] b) {
        int arrLen = a.length + b.length;
        int[] storeArray = new int[arrLen];

        for (int i = 0; i < a.length; i++) {
            storeArray[i] = a[i];
        }
        for (int i = 0; i < b.length; i++) {
            storeArray[i + a.length] = b[i];
        }
        return storeArray;
    }

    public static void printArray(int[] array) {
        for (int i = 0; i < array.length; i++)
            System.out.print(array[i] + " ");
        System.out.println();
    }
}
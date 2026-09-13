/* Java lab demo 13 — a two-dimensional array walked with nested for-each loops.
 *
 * Run:  javac 13_matrix.java  &&  java Matrix
 */
class Matrix {
  public static void main(String[] args) {
    int[][] m = {{1,2,3},
                 {4,5,6},
                 {7,8,9}};
    for(int[] row: m) {
       for(int x: row)
          System.out.print(x+" ");
       System.out.println();
    }
  }
}

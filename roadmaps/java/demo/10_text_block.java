/* Java lab demo 10 — multi-line text blocks with a formatted() template.
 *
 * Run:  javac 10_text_block.java  &&  java TextBlock
 */
class TextBlock {
  public static void main(String[] args) {
    System.out.println('T');
    var text = """
        This is a text block.
        You can use %s formatted()
        with text block templates.
        """.formatted("method");
    System.out.println(text);
  }
}

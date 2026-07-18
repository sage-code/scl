public class TextBlock {
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

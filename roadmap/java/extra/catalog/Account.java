/* define a class */
public class Account{
  // class public properties
  public Integer act_number;
  public String act_type;
  // class internal field
  private long act_amount;
  /*class constructor
    same name as the class */
  public Account(int p_number,
                 String p_type)
  {
      this.act_number = p_number;
      this.act_type = p_type;
  }

  public void deposit(long p_amount) {
    this.act_amount += p_amount;
  }
  
  public long withdraw(long p_amount) {
    long result;
    if (act_amount > p_amount) {
      this.act_amount -= p_amount;
      result = p_amount;
    } else {
      result = p_amount = this.act_amount;
      this.act_amount = 0;
    }
    return result;
  }

  public long liquidate() {
    long result = this.act_amount;
    this.act_amount = 0;
    return result;
  };
  
  public long getAmount() {
    return this.act_amount;
  }
  
}

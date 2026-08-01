class AccountDemo {
  public static void main(String[] args) {
      //create a checking account
      Account myCheckAccount = new Account(2021,"checking");

      //verify the account number
      System.out.println("New account:" + Integer.toString(myCheckAccount.act_number));

      //deposit some money
      myCheckAccount.deposit(100);

      //windrows some money
      myCheckAccount.withdraw(10);

      //verify the amount left
      System.out.println("Current amount:" + Long.toString(myCheckAccount.getAmount()));
  }
}

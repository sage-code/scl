import static java.lang.System.out;
import java.util.ArrayList;

class Main {
  static ArrayList<Account> accounts = new ArrayList<Account>();    
  public static void print_menu() {
    clear(); 
    out.println("-".repeat(30));
    System.out.println("Account Management!");
    out.println("-".repeat(30));
    out.println("0 - Clear console"); 
    out.println("1 - Add account"); 
    out.println("2 - Select account");         
    out.println("3 - Depozit"); 
    out.println("4 - Widhraw"); 
    out.println("5 - Balance"); 
    out.println("6 - Liquidate");     
    out.println("7 - List accounts"); 
    out.println("9 - Exit"); 
    out.println("-".repeat(30));    
  }
  
  public static void main(String[] args) {
    int option  = 0;
    Account current = null; 
    do {
      switch (option) {
        case 0:
          print_menu(); break;
        case 1:
          current = add_account();
          out.printf("new account:%d%n",   
                      current.act_number);
          break;
        case 2:
          current = select_account();
          break;
        case 3:          
          make_deposit(current);
          break;          
        case 4:
          make_widhraw(current);
          break;
        case 5:
          if (current != null) {
             out.printf("current balance:%d$%n",
                          current.getAmount());
          } else {
            out.println("no account selected");
          };
          break;          
        case 6:
          do_liquidate(current);
          break;
        case 7:
          list_accounts();
          break;
        case 9:break;          
        default:
          out.format("option %d " +
                     "not implemented.%n",option);
          break;
      }
      option = read_option();       
    } while (option < 9);      
    out.println("Have a nice day!");
  }
  
  static Integer read_option() {
    out.print("run:>");  
    String s = System.console().readLine();
    return Integer.parseInt(s);         
  }

  static void clear()   
  {
    out.print("\033[H\033[2J");  
    out.flush();  
  }

  static void list_accounts() {
    Account a;
    for (int i = 0; i < accounts.size(); i++) {
       a = accounts.get(i);
       out.printf("account:%d balance = %d$%n", 
                  a.act_number, 
                  a.getAmount()   
                  );
    } 
  };

  static Account add_account() {
    int number = accounts.size()+1001;
    Account a = new Account(number, "check");
    accounts.add(a);    
    return a;
  }

  static Account select_account() {    
    out.print("account number:");  
    Account a = null;    
    String s = System.console().readLine();
    Integer number = Integer.parseInt(s);  
    for (int i = 0; i < accounts.size(); i++) {
       a = accounts.get(i);
       if (a.act_number.equals(number)) {
          break;
       }
    }
    if (a == null) {
      out.println("not found!");
      a = null;
    } else {
      out.printf("current account:%d%n",   
                      a.act_number);        
    }    
    return a;
  }

  static void make_deposit(Account a) {    
    if (a == null) {
      out.println("no account selected");
    } else {
      out.print("enter ammount:");
      String s = System.console().readLine();
      a.deposit(Integer.parseInt(s));
      out.printf("success. new balance:%d$%n",
                a.getAmount());
    }
  }  

  static void make_widhraw(Account a) {    
    if (a == null) {
      out.println("no account selected");
    } else {
      out.print("enter ammount:");
      String s = System.console().readLine();
      Long amount = a.withdraw(Integer.parseInt(s)); 
      out.printf("success widhdraw:%d$%n", amount);
    }
  }  
  
  static void do_liquidate(Account a) {    
    if (a == null) {
      out.println("no account selected");
    } else {
      String s = System.console().readLine();
      Long amount = a.liquidate(); 
      out.printf("success widhdraw:%d$%n", amount);
    }
  }  
}


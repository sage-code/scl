/* multi-path decision */
class Ladder {
    // java main method is mandatory
    public static void main(String args[]) {
        int age = 25;
        if(age >= 21){
            System.out.println("You can legally drink alcohol.");
        }
        else if(age > 18){
            System.out.println("You can vote.");
        }
        else if(age > 13){
            System.out.println("You are considered a teenager.");
        }
        else {
            System.out.println("You are considered a child.");
        };
    }
}
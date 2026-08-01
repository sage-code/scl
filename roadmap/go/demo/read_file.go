//reading file
package main

import (
    "bufio"
    "fmt"
    "io"
    "os"
)

// This helper will streamline our error checks below.
func check(e error) {
    if e != nil {
        panic(e)
    }
}

func main() {

    /* You'll often want more control over how and what parts of a file are read. For these tasks, start by opening a file to obtain an os.File value.*/

    f, err := os.Open("files/dat.txt")
    check(err)

    // postpone closing the file, do not forget this one
    defer f.Close()
  
    /* Read some bytes from the beginning of the file. Allow up to 5 to be read but also note how many actually were read.*/

    b1 := make([]byte, 12)
    n1, err := f.Read(b1)
    check(err)
    fmt.Printf("%d bytes: %s\n", n1, string(b1[:n1]))

    /* You can also "Seek" to a known location in the file and "Read" from there. */

    o2, err := f.Seek(6, 0)
    check(err)
    b2 := make([]byte, 2)
    n2, err := f.Read(b2)
    check(err)
    fmt.Printf("%d bytes @ %d: ", n2, o2)
    fmt.Printf("%v\n", string(b2[:n2]))

    /* The "io" package provides some functions that may be helpful for file reading. For example, reads like the ones above can be more robustly implemented with ReadAtLeast. */

    o3, err := f.Seek(3, 0)
    check(err)
    b3 := make([]byte, 10)
    n3, err := io.ReadAtLeast(f, b3, 10)
    check(err)
    fmt.Printf("%d bytes @ %d: %s\n", n3, o3, string(b3))

    /* There is no built-in rewind, but Seek(0, 0) accomplishes this. You can go at beginning of the file and start reading*/
    _, err = f.Seek(0, 0)
    check(err)

    /* The "bufio" package implements a buffered reader that may be useful both for its efficiency with many small reads and because of the additional eading methods it provides. */

    r4 := bufio.NewReader(f)
    b4, err := r4.Peek(12)
    check(err)
    fmt.Printf("12 bytes: %s\n", string(b4))
}
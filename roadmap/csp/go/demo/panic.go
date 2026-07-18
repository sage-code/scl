package main

import "os"

func main() {
    // how to simple panic immediatly
    panic("a problem")

    // handle error using panic
    _, err := os.Create("/tmp/file")
  
    // conditional panic
    if err != nil {
        panic(err)
    }
}

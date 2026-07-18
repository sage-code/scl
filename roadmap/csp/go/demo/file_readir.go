package main

import (
    "fmt"
    "os"
)

// list files in a folder
func main() {
    //open a folder
    f, err := os.Open("./test")
    if err != nil {
        fmt.Println(err)
        return
    }
    files, err := f.Readdir(0)
    if err != nil {
        fmt.Println(err)
        return
    }
    
    for _, v := range files {
        fmt.Println(v.Name(), v.IsDir())
    }
}
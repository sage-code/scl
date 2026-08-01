package main

import "fmt"

var m map[string] int

func main() {
	m = make(map[string] int)
	m["test"] = 1
  m["demo"] = 2
  fmt.Println(m)
}
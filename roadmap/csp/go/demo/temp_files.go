package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func main() {

	f, err := os.CreateTemp("", "sample")
	check(err)
	fmt.Println("Temp file name:", f.Name())
	defer os.Remove(f.Name())

	// We can write some data to the file.
	_, err = f.Write([]byte{1, 2, 3, 4})
	check(err)


	// prefer to create a temporary *directory*.
	dname, err := os.MkdirTemp("", "sampledir")
	check(err)
	fmt.Println("Temp dir name:", dname)
	defer os.RemoveAll(dname)

	// Now we can synthesize temporary file names by
	// prefixing them with our temporary directory.
	fname := filepath.Join(dname, "file1")
	err = os.WriteFile(fname, []byte{1, 2}, 0666)
	check(err)
}

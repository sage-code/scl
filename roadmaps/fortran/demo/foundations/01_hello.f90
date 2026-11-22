program hello
  ! The mandatory first program. Demonstrates three habits used everywhere:
  ! a named program unit, implicit none, and a trimmed character output.
  implicit none
  character(len=32) :: name
  write (*, '(a)', advance='no') 'What is your name? '
  read (*, '(a)') name
  print '(a,a)', 'Hello, ', trim(name)
end program hello
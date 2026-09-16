program formatted_io
  ! FORMAT descriptors control every character of output, and iostat
  ! turns file failure into a handled branch instead of a crash.
  implicit none
  integer :: unit, ios, n = 0
  real :: pi = 3.14159265
  real :: x
  character(len=64) :: line
  character(len=128) :: msg

  ! formatting: fixed-point, scientific, integer without width
  print '(a,f8.4,1x,a,e12.5)', 'pi = ', pi, ' pi = ', pi

  ! write a small data file
  open (newunit=unit, file="values.txt", status="replace", action="write")
  write (unit, '(f8.3)') 1.5, 2.25, -3.75
  close (unit)

  ! reading back robustly: end-of-file = ios < 0, malformed = ios > 0
  open (newunit=unit, file="values.txt", status="old", action="read", &
        iostat=ios, iomsg=msg)
  if (ios /= 0) then
     print '(a)', trim(msg)
     stop 1
  end if
  do
     read (unit, '(a)', iostat=ios) line
     if (ios < 0) exit                    ! clean end of file
     read (line, *, iostat=ios) x         ! parse the text record
     if (ios > 0) cycle                   ! skip malformed records
     n = n + 1
     print '(a,i0,a,f8.3)', 'record ', n, ' = ', x
  end do
  close (unit)
  print '(a,i0,a)', 'read ', n, ' records from values.txt'
end program formatted_io
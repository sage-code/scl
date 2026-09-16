program allocatable_strings
  ! Deferred-length strings grow on every assignment, and internal files
  ! convert numbers to text and back using the same FORMAT machinery.
  implicit none
  character(len=:), allocatable :: report
  character(len=32) :: buffer
  real :: temperature = 21.437
  integer :: year = 2026

  report = "case_07: "                        ! exact length allocation
  report = report // "temperature = "         ! grows again automatically

  write (buffer, '(f7.3)') temperature        ! number -> text via internal file
  report = report // buffer // " C, year "    // ' ' ! single quotes also legal
  write (buffer, '(i0)') year
  report = report // buffer

  print '(a)', report
  print '(a,i0)', 'characters: ', len(report)

  ! and the reverse trip: parse text back into a number
  buffer = "42.5"
  read (buffer, *) temperature
  print '(a,f6.2)', 'parsed value: ', temperature
end program allocatable_strings
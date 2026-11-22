program namelist_demo
  ! NAMELIST: self-describing config files with zero parsing code.
  ! The write produces a file a human can edit; the read restores it.
  implicit none
  integer :: unit
  integer :: iterations = 100
  real    :: tolerance = 1.0e-6
  logical :: verbose = .false.
  character(len=32) :: case_id = "case_07"
  namelist /settings/ iterations, tolerance, verbose, case_id

  ! write defaults out to a config file
  open (newunit=unit, file="run.nml", status="replace", action="write")
  write (unit, nml=settings)
  close (unit)

  ! clobber the values, then prove reading restores them
  iterations = 0
  tolerance = 0.0
  case_id = ""

  open (newunit=unit, file="run.nml", status="old", action="read")
  read (unit, nml=settings)
  close (unit)

  print *, 'case=', trim(case_id), ' iterations=', iterations, &
       ' tol=', tolerance, ' verbose=', merge('yes', 'no', verbose)
end program namelist_demo
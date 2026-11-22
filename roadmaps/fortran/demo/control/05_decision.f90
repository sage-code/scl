program decision
  ! IF ladder and SELECT CASE side by side. The temperature classifier
  ! and the slot dispatcher are the two canonical decision patterns.
  implicit none
  real :: temperature
  integer :: slot

  print '(a)', 'Temperature (C)?'
  read *, temperature
  if (temperature < 0.0) then
     print '(a)', 'ice'
  else if (temperature < 100.0) then
     print '(a)', 'liquid water'
  else
     print '(a)', 'steam'
  end if

  print '(a)', 'Slot (1-3)?'
  read *, slot
  select case (slot)
  case (1)
     print '(a)', 'first'
  case (2)
     print '(a)', 'second'
  case default
     print '(a)', 'unknown — maybe you meant 1 or 2?'
  end select
end program decision
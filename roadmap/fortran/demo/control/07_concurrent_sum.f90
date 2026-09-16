program concurrent_sum
  ! DO CONCURRENT with the F2018 REDUCE locality: each iteration may be
  ! assigned to a different thread/SIMD lane; the summation is race-free
  ! because the compiler owns the partial-result merge.
  use iso_fortran_env, only: int64
  implicit none
  integer, parameter :: n = 100000
  real :: v(n)
  real :: total
  integer(int64) :: start, finish, rate

  call random_number(v)
  call system_clock(start, rate)

  total = 0.0
  do concurrent (i = 1:n) reduce(+:total)
     total = total + v(i)
  end do

  call system_clock(finish)
  print '(a,es15.7)', 'sum = ', total
  print '(a,f8.4,a)', 'time = ', real(finish - start) / rate, ' s'
end program concurrent_sum
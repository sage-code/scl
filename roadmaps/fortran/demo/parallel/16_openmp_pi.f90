program pi_openmp
  ! OpenMP: parallelize a loop with a directive; REDUCTION(+:sum) makes
  ! the shared accumulator race-free. Build: gfortran -fopenmp -O3
  ! Run with OMP_NUM_THREADS=1..N and watch the wall time shrink.
  use omp_lib
  implicit none
  integer, parameter :: n = 100000000
  real(8) :: sum, x, h
  integer :: i, t1, t2, rate
  real(8) :: elapsed

  call system_clock(rate=rate)
  h = 1.0_8 / n
  sum = 0.0_8

  call system_clock(t1)
  !$omp parallel do reduction(+:sum) private(x)
  do i = 1, n
     x = (i - 0.5_8) * h
     sum = sum + 4.0_8 / (1.0_8 + x * x)   ! integrate 4/(1+x^2) on [0,1]
  end do
  !$omp end parallel do
  call system_clock(t2)

  elapsed = real(t2 - t1, 8) / rate
  print '(a,f12.9)', 'pi ~ ', h * sum
  print '(a,i0,a,f8.4,a)', 'threads = ', omp_get_max_threads(), &
       '  time = ', elapsed, ' s'
end program pi_openmp
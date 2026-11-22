program coarray_sum
  ! Coarrays: the same executable runs as N images; CO_SUM (F2018) reduces
  ! a value across ALL images in one collective call.
  ! Build & run with one image:   gfortran -fcoarray=single coarray_sum.f90
  ! Multi-image (if runtime):     gfortran -fcoarray=lib && cafrun -n 4 ./a.exe
  implicit none
  integer :: me, n
  real :: partial, lowered

  me = this_image()
  n = num_images()
  partial = real(me * me)          ! each image contributes its own slice
  lowered = partial                ! co_sum folds INTO its first argument

  call co_sum(lowered)             ! sum over images 1..n

  if (me == 1) then
     print '(a,i0,a,f8.0)', 'images = ', n, '  sum of squares = ', lowered
  end if
  sync all                         ! clean rendezvous before exit
end program coarray_sum
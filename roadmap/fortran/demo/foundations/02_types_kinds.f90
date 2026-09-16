program types_kinds
  ! Show every intrinsic type and the KIND trick: kinds select hardware
  ! representations portably, and iso_fortran_env names them symbolically.
  use iso_fortran_env, only: real32, real64, real128, int32, int64
  implicit none
  integer(int32)          :: n = 42
  real(real32)            :: x = 1.5
  real(real64)            :: y = 1.0d0      ! double precision
  complex(real64)         :: z
  logical                 :: flag = .true.
  character(len=16)       :: tag = "sample"

  z = (1.0d0, -2.0d0)
  print *, 'integer  ', n
  print *, 'real32   ', x
  print *, 'real64   ', y
  print *, 'complex  ', z
  print *, 'logical  ', flag
  print *, 'character', trim(tag), len(tag)
  ! The three reals prove the variants coexist in one program.
  print '(a,3es18.9)', 'sizes   ', real32, real64, real128
  print *, 'int sizes', int32, int64
end program types_kinds
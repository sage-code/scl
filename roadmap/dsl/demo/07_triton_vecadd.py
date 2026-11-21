# Triton GPU kernel DSL: elementwise vector addition (x + y -> out).
# Each program instance processes a contiguous BLOCK_SIZE tile.
import triton
import triton.language as tl


@triton.jit
def vec_add_kernel(x_ptr, y_ptr, out_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
    pid = tl.program_id(axis=0)
    offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements

    # Masked loads/stores prevent out-of-bounds GPU memory access on tail tiles
    x = tl.load(x_ptr + offsets, mask=mask)
    y = tl.load(y_ptr + offsets, mask=mask)
    tl.store(out_ptr + offsets, x + y, mask=mask)

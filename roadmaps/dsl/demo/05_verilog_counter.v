// 4-bit synchronous up-counter with active-high reset and enable in Verilog.
module counter4 (
    input  wire       clk,
    input  wire       rst,
    input  wire       en,
    output reg  [3:0] count
);
    // Non-blocking assignments (<=) model synchronous flip-flop updates.
    always @(posedge clk) begin
        if (rst) begin
            count <= 4'b0000;
        end else if (en) begin
            count <= count + 4'b0001;
        end
    end
endmodule

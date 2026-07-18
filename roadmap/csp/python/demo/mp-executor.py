import concurrent.futures as cf
import time

def job(duration):
  time.sleep(duration)
  print(f"job: {duration}")
  return duration * 2

if __name__ == "__main__":
  start = time.perf_counter();
  jobs = [5,2,3,1,4]
  with cf.ProcessPoolExecutor() as ex:
    r = ex.map(job, jobs)
  print(list(r))
  print(time.perf_counter()-start)
import multiprocessing as mp
import time
def task(i):
   print("sleeping ",i)
   time.sleep(3)
   print("awakening ",i)

if __name__ == '__main__':
   jobs = []
   for i in range(4):
      p = mp.Process(target=task,args=[i])
      p.start()
      jobs.append(p)
   for p in jobs:
      p.join()
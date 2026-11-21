;; Clojure immutable data pipeline using threading macros (->>).
;; Demonstrates functional transformations over persistent maps and vectors.

(ns dsl.pipeline)

(def orders
  [{:id 1 :status :paid   :total 42.50}
   {:id 2 :status :draft  :total 15.00}
   {:id 3 :status :paid   :total 87.50}])

(def paid-revenue
  (->> orders
       (filter #(= (:status %) :paid))
       (map :total)
       (reduce + 0.0)))

(println "Paid revenue:" paid-revenue)

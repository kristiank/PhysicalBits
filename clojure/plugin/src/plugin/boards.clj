(ns plugin.boards)

(def boards
  {:uno {:pin-names ["D2" "D3" "D4" "D5" "D6" "D7" "D8" "D9" "D10" "D11" "D12" "D13"
                     "A0" "A1" "A2" "A3" "A4" "A5"]
         :pin-numbers [2 3 4 5 6 7 8 9 10 11 12 13
                       14 15 16 17 18 19]}})

(defn get-pin-name [pin-number]
  (let [board (boards :uno) ; TODO(Richo): Hardcoded UNO board!
        index (.indexOf (board :pin-numbers) pin-number)]
    (if-not (= -1 index)
      (nth (board :pin-names) index)
      nil)))

(defn get-pin-number [pin-name]
  (let [board (boards :uno) ; TODO(Richo): Hardcoded UNO board!
        index (.indexOf (board :pin-names) pin-name)]
    (if-not (= -1 index)
      (nth (board :pin-numbers) index)
      nil)))

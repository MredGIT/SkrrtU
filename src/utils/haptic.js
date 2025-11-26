class HapticFeedback {
  vibrate(pattern = [10]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  light() {
    this.vibrate([10])
  }

  medium() {
    this.vibrate([30])
  }

  heavy() {
    this.vibrate([50])
  }

  success() {
    this.vibrate([10, 50, 10])
  }

  error() {
    this.vibrate([50, 100, 50])
  }

  selection() {
    this.vibrate([5])
  }
}

export default new HapticFeedback()

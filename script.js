class PerfectPitchTest {
  constructor() {
    this.initializePiano();
    this.currentNote = null;
    this.currentOctave = null;
    this.correctCount = 0;
    this.currentStreak = 0;
    this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.isLoaded = false;
    
    this.initializeElements();
    this.addEventListeners();
    this.initializeStreak();
    this.disableInteractionsDuringLoad();
    this.initializeRepairSystem();
  }

  async initializePiano() {
    const piano = new Tone.Sampler({
      urls: {
        "C4": "C4.mp3",
        "C5": "C5.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        this.isLoaded = true;
        this.enableInteractions();
      }
    }).toDestination();

    this.piano = piano;
  }

  disableInteractionsDuringLoad() {
    this.playButton?.setAttribute('disabled', 'true');
    this.replayButton?.setAttribute('disabled', 'true');
    this.noteButtons?.forEach(btn => btn.setAttribute('disabled', 'true'));
    this.feedbackElement.textContent = 'Loading piano sounds...';
    this.feedbackElement.className = 'feedback';
  }

  enableInteractions() {
    this.playButton?.removeAttribute('disabled');
    this.noteButtons?.forEach(btn => btn.removeAttribute('disabled'));
    this.feedbackElement.textContent = 'Piano loaded! Click "Play Note" to begin.';
  }

  initializeElements() {
    this.playButton = document.getElementById('playNote');
    this.correctDisplay = document.getElementById('correct');
    this.streakDisplay = document.getElementById('streak');
    this.feedbackElement = document.getElementById('feedback');
    this.noteButtons = document.querySelectorAll('.note-buttons button');
    this.octaveCheckboxes = document.querySelectorAll('.octave-controls input[type="checkbox"]');
    this.dailyStreakDisplay = document.getElementById('dailyStreak');
    this.replayButton = document.getElementById('replayNote');
  }

  addEventListeners() {
    this.playButton.addEventListener('click', () => this.playNewNote());
    this.replayButton.addEventListener('click', () => this.replayCurrentNote());
    this.noteButtons.forEach(button => {
      button.addEventListener('click', (e) => this.checkAnswer(e.target.dataset.note));
    });
  }

  getSelectedOctaves() {
    const selectedOctaves = Array.from(this.octaveCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => parseInt(checkbox.value));
    
    if (selectedOctaves.length === 0) {
      this.octaveCheckboxes[2].checked = true;
      return [4];
    }
    return selectedOctaves;
  }

  getRandomNote() {
    const randomNoteIndex = Math.floor(Math.random() * this.notes.length);
    const selectedOctaves = this.getSelectedOctaves();
    const randomOctaveIndex = Math.floor(Math.random() * selectedOctaves.length);
    
    this.currentOctave = selectedOctaves[randomOctaveIndex];
    return this.notes[randomNoteIndex];
  }

  async playNewNote() {
    if (!this.isLoaded) return;
    
    await Tone.start();
    this.currentNote = this.getRandomNote();
    this.piano.triggerAttackRelease(this.currentNote + this.currentOctave, '2n');
    this.replayButton.disabled = false;
  }

  async replayCurrentNote() {
    if (this.currentNote && this.currentOctave && this.isLoaded) {
      await Tone.start();
      this.piano.triggerAttackRelease(this.currentNote + this.currentOctave, '2n');
    }
  }

  checkAnswer(selectedNote) {
    if (!this.currentNote) {
      this.feedbackElement.textContent = 'Please play a note first!';
      return;
    }

    if (selectedNote === this.currentNote) {
      this.correctCount++;
      this.currentStreak++;
      this.feedbackElement.textContent = `Correct! (${this.currentNote}${this.currentOctave})`;
      this.feedbackElement.className = 'feedback correct';
    } else {
      this.currentStreak = 0;
      this.feedbackElement.textContent = `Incorrect! The note was ${this.currentNote}${this.currentOctave}`;
      this.feedbackElement.className = 'feedback incorrect';
    }

    this.updateDisplays();
    this.replayButton.disabled = true;

    if (this.correctCount >= 30) {
      this.gameComplete();
    } else {
      setTimeout(() => this.playNewNote(), 1500);
    }
  }

  updateDisplays() {
    this.correctDisplay.textContent = this.correctCount;
    this.streakDisplay.textContent = this.currentStreak;
  }

  initializeStreak() {
    this.lastCompletionDate = localStorage.getItem('lastCompletionDate');
    this.dailyStreak = parseInt(localStorage.getItem('dailyStreak')) || 0;
    
    if (this.lastCompletionDate) {
      const lastDate = new Date(this.lastCompletionDate);
      const today = new Date();
      
      lastDate.setHours(0, 0, 0, 0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((todayMidnight - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        this.lastStreak = this.dailyStreak; // Store the lost streak
        this.dailyStreak = 0;
        localStorage.setItem('dailyStreak', '0');
        localStorage.setItem('lastLostStreak', this.lastStreak.toString());
      }
    }
    
    this.updateDailyStreakDisplay();
  }

  updateDailyStreakDisplay() {
    this.dailyStreakDisplay.textContent = this.dailyStreak;
  }

  initializeRepairSystem() {
    this.repairButton = document.getElementById('repairStreak');
    this.repairCountDisplay = document.getElementById('repairCount');
    
    // Initialize repairs if not exists
    const currentMonth = new Date().getMonth();
    const storedMonth = localStorage.getItem('repairMonth');
    
    if (storedMonth === null || parseInt(storedMonth) !== currentMonth) {
      localStorage.setItem('repairCount', '5');
      localStorage.setItem('repairMonth', currentMonth.toString());
    }
    
    this.repairCount = parseInt(localStorage.getItem('repairCount')) || 0;
    this.updateRepairDisplay();
    
    this.repairButton.addEventListener('click', () => this.repairStreak());
    this.checkRepairButtonState();
  }

  updateRepairDisplay() {
    this.repairCountDisplay.textContent = this.repairCount;
  }

  checkRepairButtonState() {
    const lastLostStreak = parseInt(localStorage.getItem('lastLostStreak')) || 0;
    const canRepair = this.repairCount > 0 && lastLostStreak > 0 && this.dailyStreak === 0;
    this.repairButton.disabled = !canRepair;
    this.repairButton.style.display = canRepair ? 'block' : 'none';
  }

  repairStreak() {
    if (this.repairCount <= 0) return;
    
    const lastLostStreak = parseInt(localStorage.getItem('lastLostStreak')) || 0;
    if (lastLostStreak > 0 && this.dailyStreak === 0) {
      this.dailyStreak = lastLostStreak;
      localStorage.setItem('dailyStreak', this.dailyStreak.toString());
      this.repairCount--;
      localStorage.setItem('repairCount', this.repairCount.toString());
      localStorage.setItem('lastLostStreak', '0');
      
      this.updateDailyStreakDisplay();
      this.updateRepairDisplay();
      this.checkRepairButtonState();
      
      this.feedbackElement.textContent = `Streak repaired! Your ${lastLostStreak}-day streak has been restored.`;
      this.feedbackElement.className = 'feedback correct';
    }
  }

  gameComplete() {
    alert('Congratulations! You\'ve completed the Perfect Pitch Test!');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    if (this.lastCompletionDate !== today) {
      this.dailyStreak++;
      localStorage.setItem('dailyStreak', this.dailyStreak.toString());
      localStorage.setItem('lastCompletionDate', today);
      this.updateDailyStreakDisplay();
    }
    
    this.correctCount = 0;
    this.currentStreak = 0;
    this.updateDisplays();
    this.feedbackElement.textContent = 'Game complete! Click "Play Note" to start a new game.';
    this.currentNote = null;
    this.currentOctave = null;
    this.replayButton.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PerfectPitchTest();
});
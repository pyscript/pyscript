from dataclasses import dataclass, field
import sys

@dataclass
class BeatSync:
    fft_res: int = field()

    on_beat: bool = False
    beat: int = -1
    since_last_beat: float = sys.maxsize

    _prev: int = 0
    _count: int = 0
    _bins: list[int] = field(default_factory=list)
    _last_detection: float = -1.0
    _threshold: int = 50
    _diff: int = 40
    _cooldown: float = 0.2

    _highest: int = 0

    def __post_init__(self):
        self._bins = [int(13/16*self.fft_res/2)+17, int(13/16*self.fft_res/2)+18]

    def reset(self):
        self.beat = -1
        self._prev = 0
        self._count = 0
        self._last_detection = -1.0
        self.since_last_beat = sys.maxsize
        # print('bs reset')

    def update(self, data, running_time):
        self._count += 1
        self.since_last_beat = running_time - self._last_detection
        d = sum(data[bin] for bin in self._bins)
        if d < self._threshold:
            self.on_beat = False
        elif d - self._prev < self._diff:
            self.on_beat = False
        elif self.since_last_beat < self._cooldown:
            self.on_beat = False
        else:
            self._last_detection = running_time
            self.since_last_beat = 0
            self.on_beat = True
            self.beat += 1
        self._prev = d

@dataclass
class FreqIntensity:
    freq: float = field()
    fft_res: int = field()

    intensity: float = 0.0
    intensity_slew: float = 0.0
    scale_min: float = 0.0
    scale_max: float = 350
    max: float = 0.0
    _sample_rate: int = 48000
    _bin_indexes: list[int] = field(default_factory=list)
    _harmonics: int = 8
    _slew_factor: float = 0.8

    def __post_init__(self):
        self._bin_indexes = [
            round((harmonic+1) * self.freq / self._sample_rate * self.fft_res / 2)
            for harmonic in range(self._harmonics)
        ]
        print(self._bin_indexes)

    def update(self, data):
        intensity = 0.0
        for bin in range(self._harmonics):
            intensity += data[self._bin_indexes[bin]]/(bin+1)
        self.intensity = intensity
        self.intensity_slew = self._slew_factor * self.intensity_slew + (1 - self._slew_factor) * intensity
        self.max = max(intensity, self.max)

    @property
    def intensity_scaled(self):
        raw = max(0, min(1.0, (self.intensity_slew - self.scale_min)/(self.scale_max - self.scale_min)))
        return raw * raw

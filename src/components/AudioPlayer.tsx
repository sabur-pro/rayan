import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, AudioSource, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../theme/colors';
import { File, Paths } from 'expo-file-system';

interface AudioPlayerProps {
  audioUrl: string;
  fileName?: string;
  compact?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, fileName, compact = false }) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(colors);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<'download' | 'stream'>('download');

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: downloadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [downloadProgress]);

  const downloadAudio = async () => {
    setIsLoading(true);
    setLoadingMode('download');
    setDownloadProgress(0);

    try {
      const fileName = 'audio_' + Date.now() + '.wav';
      const file = new File(Paths.cache, fileName);
      
      // Simple fetch with progress tracking
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const reader = response.body?.getReader();
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (contentLength > 0) {
            const progress = (receivedLength / contentLength) * 100;
            setDownloadProgress(Math.floor(progress));
          }
        }
      }
      
      // Combine chunks and save
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      console.log('[AudioPlayer] Total downloaded bytes:', totalLength);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Create file before writing
      if (!file.exists) {
        await file.create();
      }
      await file.write(combined);
      
      const uri = file.uri;
      console.log('[AudioPlayer] File downloaded to:', uri);
      console.log('[AudioPlayer] File size:', file.size, 'bytes');
      console.log('[AudioPlayer] File exists:', file.exists);
      
      setLocalUri(uri);
      
      // Load audio and wait for it to be ready
      await loadAudio(uri);
      
      // Only mark as downloaded after successful load
      if (player.isLoaded) {
        setIsDownloaded(true);
        console.log('[AudioPlayer] Ready to play!');
      } else {
        console.error('[AudioPlayer] Local file failed, trying direct URL...');
        // Fallback: try loading directly from URL
        await loadAudio(audioUrl);
        if (player.isLoaded) {
          setIsDownloaded(true);
          console.log('[AudioPlayer] Loaded from URL successfully!');
        } else {
          console.error('[AudioPlayer] Failed to load from both local file and URL');
          setIsDownloaded(false);
        }
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAudio = async (uri: string) => {
    try {
      console.log('[AudioPlayer] Loading audio from URI:', uri);
      
      // Configure audio mode for playback
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
        console.log('[AudioPlayer] Audio mode configured');
      } catch (modeError) {
        console.warn('[AudioPlayer] Could not set audio mode:', modeError);
      }
      
      // Replace the audio source
      player.replace({ uri } as AudioSource);
      
      // Wait for player to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds total
      
      while (!player.isLoaded && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (attempts % 10 === 0) {
          console.log(`[AudioPlayer] Waiting for load... attempt ${attempts}/${maxAttempts}`);
        }
      }
      
      if (player.isLoaded) {
        console.log('[AudioPlayer] Audio loaded successfully!', {
          isLoaded: player.isLoaded,
          duration: player.duration,
          playing: player.playing
        });
      } else {
        console.error('[AudioPlayer] Failed to load audio after', attempts * 100, 'ms');
        console.error('[AudioPlayer] Final status:', {
          isLoaded: player.isLoaded,
          duration: player.duration
        });
      }
    } catch (error) {
      console.error('[AudioPlayer] Error loading audio:', error);
    }
  };


  const togglePlayPause = () => {
    console.log('[AudioPlayer] togglePlayPause called', {
      hasPlayer: !!player,
      isDownloaded,
      isLoaded: player?.isLoaded,
      playing: status.playing,
      duration: status.duration,
      currentTime: status.currentTime
    });
    
    if (!player || !isDownloaded) {
      console.log('[AudioPlayer] Cannot play - player not ready');
      return;
    }

    if (!player.isLoaded) {
      console.log('[AudioPlayer] Cannot play - audio not loaded');
      return;
    }

    try {
      if (status.playing) {
        console.log('[AudioPlayer] Pausing...');
        player.pause();
      } else {
        console.log('[AudioPlayer] Playing...');
        player.play();
      }
    } catch (error) {
      console.error('[AudioPlayer] Error toggling playback:', error);
    }
  };

  const seekTo = (seconds: number) => {
    if (!player || !isDownloaded) return;
    player.seekTo(seconds);
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    setPlaybackSpeed(nextSpeed);
    if (player) {
      player.setPlaybackRate(nextSpeed);
    }
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const quickPlay = async () => {
    setIsLoading(true);
    setLoadingMode('stream');
    try {
      console.log('[AudioPlayer] Quick play from URL');
      await loadAudio(audioUrl);
      if (player.isLoaded) {
        setIsDownloaded(true);
        console.log('[AudioPlayer] Stream ready!');
      }
    } catch (error) {
      console.error('[AudioPlayer] Quick play failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDownloaded && !isLoading) {
    if (compact) {
      return (
        <View style={styles.compactContainer}>
          <TouchableOpacity style={styles.compactButton} onPress={quickPlay}>
            <Ionicons name="play-circle" size={20} color={colors.primary} />
            <Text style={styles.compactText} numberOfLines={1}>
              {fileName || 'Аудио'}
            </Text>
            <Text style={styles.compactDuration}>Нажмите для воспроизведения</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.downloadContainer}>
          <View style={styles.audioIcon}>
            <Ionicons name="musical-notes" size={40} color={colors.primary} />
          </View>
          <Text style={styles.fileName}>{fileName || 'Audio File'}</Text>
          <TouchableOpacity style={styles.playButtonFull} onPress={quickPlay}>
            <Ionicons name="play-circle" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Слушать</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    if (compact) {
      return (
        <View style={styles.compactContainer}>
          <View style={styles.compactButton}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.compactText}>Подключение...</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.progressCircle}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Подключение...</Text>
        </View>
      </View>
    );
  }

  // Compact player for MD viewer
  if (compact) {
    return (
      <View style={styles.compactPlayer}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.compactPlayBtn}>
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
        
        <View style={styles.compactInfo}>
          <View style={styles.compactProgress}>
            <View
              style={[
                styles.compactProgressFill,
                {
                  width: status.duration > 0 ? `${(status.currentTime / status.duration) * 100}%` : '0%',
                },
              ]}
            />
          </View>
          <View style={styles.compactTimeRow}>
            <Text style={styles.compactTime}>{formatTime(status.currentTime * 1000)}</Text>
            <Text style={styles.compactFileName} numberOfLines={1}>{fileName || 'Аудио'}</Text>
            <Text style={styles.compactTime}>{formatTime(status.duration * 1000)}</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={() => seekTo(Math.max(0, status.currentTime - 10))} style={styles.compactSkip}>
          <Ionicons name="play-back" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => seekTo(Math.min(status.duration, status.currentTime + 10))} style={styles.compactSkip}>
          <Ionicons name="play-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={changeSpeed} style={styles.compactSpeed}>
          <Text style={styles.compactSpeedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Full player
  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <View style={styles.infoSection}>
          <Ionicons name="musical-notes" size={24} color={colors.primary} />
          <Text style={styles.playerFileName}>{fileName || 'Audio File'}</Text>
          {!player.isLoaded && (
            <Text style={styles.statusText}>⏳ Loading...</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.timeText}>{formatTime(status.currentTime * 1000)}</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: status.duration > 0 ? `${(status.currentTime / status.duration) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.sliderTouchArea}
              activeOpacity={1}
              onPress={(e) => {
                const locationX = e.nativeEvent.locationX;
                const width = 250; // approximate slider width
                const percentage = locationX / width;
                seekTo(percentage * status.duration);
              }}
            />
          </View>
          <Text style={styles.timeText}>{formatTime(status.duration * 1000)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={changeSpeed}
          >
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => seekTo(Math.max(0, status.currentTime - 10))}
          >
            <Ionicons name="play-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={36}
              color="#FFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => seekTo(Math.min(status.duration, status.currentTime + 10))}
          >
            <Ionicons name="play-forward" size={28} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.spacer} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    downloadContainer: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    audioIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    fileName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 10,
    },
    downloadButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      paddingHorizontal: 20,
    },
    playButton2: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    downloadButton2: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFF',
    },
    buttonText2: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    progressCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    progressBarContainer: {
      width: '100%',
      alignItems: 'center',
    },
    progressBarBackground: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    playerContainer: {
      gap: 20,
    },
    infoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    playerFileName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginLeft: 8,
    },
    timelineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      width: 40,
      textAlign: 'center',
    },
    sliderContainer: {
      flex: 1,
      height: 40,
      justifyContent: 'center',
    },
    sliderTrack: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    sliderFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    sliderTouchArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    speedButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    speedText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    skipButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    spacer: {
      width: 48,
    },
    // Compact player styles (Telegram-like)
    compactContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 8,
      overflow: 'hidden',
    },
    compactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 10,
    },
    compactText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    compactDuration: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    compactPlayer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactPlayBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactInfo: {
      flex: 1,
      gap: 2,
    },
    compactProgress: {
      height: 2,
      backgroundColor: colors.border,
      borderRadius: 1,
      overflow: 'hidden',
    },
    compactProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    compactTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    compactTime: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textSecondary,
      minWidth: 32,
    },
    compactFileName: {
      flex: 1,
      fontSize: 11,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    compactSkip: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactSpeed: {
      width: 32,
      height: 28,
      backgroundColor: colors.background,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactSpeedText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    playButtonFull: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
  });

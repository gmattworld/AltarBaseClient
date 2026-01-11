import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { environment } from "../../../../environments/environment";
import { ConfigModel } from "../../../core/models/config.model";
import { SafePipe } from "../../../infrastructure/pipes/safe.pipe";
import { CommonService } from "../../../infrastructure/services/common.service";
import { BaseResponse, BaseResponseExt } from "../../../core/models/base-response";
import { ChurchService } from "../../../core/models/church-service";
import { ChurchEvent } from "../../../core/models/church-event.model";

// --- Data Models for clarity and type safety ---
interface Ministry {
  title: string;
  description: string;
  icon: string;
}

interface ServiceTime {
  day: string;
  time: string;
  type: string;
}

interface UpcomingEvent {
  title: string;
  date: string;
  time: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SafePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private commonService = inject(CommonService);
  public configData = signal<ConfigModel | null>(null);
  public weeklySchedule = signal<ChurchService[]>([]);
  public upcomingEvents = signal<ChurchEvent[]>([]);

  public ministries = signal<Ministry[]>([
    {
      title: "Children's Church",
      description: 'Nurturing the next generation in the way of the Lord.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      title: 'Youth & Young Adults',
      description: 'Empowering young people to be leaders and disciples.',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    {
      title: 'Good Women Fellowship',
      description: 'A fellowship of virtuous women, building homes and the church.',
      icon: 'M12 14l9-5-9-5-9 5 9 5z'
    },
    {
      title: 'Elders Fellowship',
      description: 'Providing wisdom, guidance, and support for the church body.',
      icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
  ]);

  // --- Computed Signals for Dynamic URLs (SSR-Safe) ---
  public readonly googleMapsUrl = computed(() => {
    const churchConfig = this.configData();
    if (!churchConfig?.address) {
      return '';
    }
    const address = `${churchConfig.address}, ${churchConfig.city}, ${churchConfig.state}`;
    const apiKey = environment.GOOGLE_MAPS_API_KEY;
    // Correct, modern Google Maps embed URL format
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
  });

  public readonly welcomeVideoUrl = computed(() => {
    const videoId = this.configData()?.youtubeVideoId ?? 'dQw4w9WgXcQ'; // Fallback video ID
    return `https://www.youtube.com/embed/${videoId}`;
  });


  ngOnInit(): void {
    this.commonService.getConfig().subscribe({
      next: (config) => {
        this.configData.set(config.data ?? null);
      },
      error: (err) => {
        console.error('Failed to load config:', err);
      },
    });

    this.commonService.getChurchServices().subscribe({
      next: (resp: BaseResponseExt<ChurchService>) => {
        this.weeklySchedule.set(resp.data);
      }
    });

    this.commonService.getEvents().subscribe({
      next: (resp: BaseResponseExt<ChurchEvent>) => {
        this.upcomingEvents.set(resp.data);
      }
    });
  }
}